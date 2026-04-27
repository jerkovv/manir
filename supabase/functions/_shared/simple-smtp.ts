export interface SmtpSettings {
  hostname: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
}

export interface SmtpMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function sendSmtpEmail(settings: SmtpSettings, message: SmtpMessage) {
  const client = await SimpleSmtpClient.connect(settings);
  try {
    await client.send(message);
  } finally {
    client.close();
  }
}

class SimpleSmtpClient {
  private readBuffer = "";

  private constructor(private conn: Deno.Conn, private settings: SmtpSettings, private secure: boolean) {}

  static async connect(settings: SmtpSettings) {
    const port = Number(settings.port);
    let secure = settings.tls || port === 465;
    let conn: Deno.TcpConn | Deno.TlsConn = secure
      ? await Deno.connectTls({ hostname: settings.hostname, port })
      : await Deno.connect({ hostname: settings.hostname, port });

    const client = new SimpleSmtpClient(conn, { ...settings, port }, secure);
    await client.expect([220]);
    let capabilities = await client.ehlo();

    if (!secure) {
      if (!capabilities.some((line) => line.toUpperCase().startsWith("STARTTLS"))) {
        throw new Error("SMTP server ne podržava STARTTLS na ovom portu");
      }
      await client.command("STARTTLS", [220]);
      if (!(client.conn instanceof Deno.TcpConn)) {
        throw new Error("STARTTLS zahtijeva TCP konekciju");
      }
      client.conn = await Deno.startTls(client.conn, { hostname: settings.hostname });
      client.readBuffer = "";
      client.secure = true;
      secure = true;
      capabilities = await client.ehlo();
    }

    await client.authenticate(capabilities);
    return client;
  }

  async send(message: SmtpMessage) {
    const fromEmail = extractEmail(message.from);
    const toEmail = extractEmail(message.to);

    await this.command(`MAIL FROM:<${fromEmail}>`, [250]);
    await this.command(`RCPT TO:<${toEmail}>`, [250, 251]);
    await this.command("DATA", [354]);
    await this.write(buildMimeMessage(message));
    await this.expect([250]);
    await this.command("QUIT", [221]);
  }

  close() {
    try { this.conn.close(); } catch { /* ignore */ }
  }

  private async authenticate(capabilities: string[]) {
    const authLine = capabilities.find((line) => line.toUpperCase().startsWith("AUTH"))?.toUpperCase() ?? "";
    if (authLine.includes("PLAIN")) {
      const token = base64Utf8(`\0${this.settings.username}\0${this.settings.password}`);
      await this.command(`AUTH PLAIN ${token}`, [235]);
      return;
    }

    await this.command("AUTH LOGIN", [334]);
    await this.command(base64Utf8(this.settings.username), [334]);
    await this.command(base64Utf8(this.settings.password), [235]);
  }

  private async ehlo() {
    const response = await this.command(`EHLO ${this.settings.hostname}`, [250]);
    return response.lines;
  }

  private async command(command: string, expectedCodes: number[]) {
    await this.write(`${command}\r\n`);
    return this.expect(expectedCodes);
  }

  private async expect(expectedCodes: number[]) {
    const response = await this.readResponse();
    if (!expectedCodes.includes(response.code)) {
      throw new Error(`${response.code}: ${response.lines.join(" | ")}`);
    }
    return response;
  }

  private async readResponse() {
    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();
      if (line === null) throw new Error("SMTP server je zatvorio konekciju");
      lines.push(line);
      if (line.length >= 4 && line[3] !== "-") break;
    }
    const code = Number(lines[0].slice(0, 3));
    return { code, lines: lines.map((line) => line.slice(4).trim()) };
  }

  private async readLine(): Promise<string | null> {
    while (!this.readBuffer.includes("\n")) {
      const chunk = new Uint8Array(4096);
      const bytesRead = await this.conn.read(chunk);
      if (bytesRead === null) return null;
      this.readBuffer += decoder.decode(chunk.subarray(0, bytesRead), { stream: true });
    }
    const newlineIndex = this.readBuffer.indexOf("\n");
    const line = this.readBuffer.slice(0, newlineIndex).replace(/\r$/, "");
    this.readBuffer = this.readBuffer.slice(newlineIndex + 1);
    return line;
  }

  private async write(value: string) {
    await this.conn.write(encoder.encode(value));
  }
}

function buildMimeMessage(message: SmtpMessage) {
  const body = message.html ?? escapeText(message.text ?? "");
  const headers = [
    `From: ${sanitizeHeader(message.from)}`,
    `To: ${sanitizeHeader(message.to)}`,
    message.replyTo ? `Reply-To: ${sanitizeHeader(message.replyTo)}` : null,
    `Subject: ${encodeHeader(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: ${message.html ? "text/html" : "text/plain"}; charset=UTF-8`,
    "Content-Transfer-Encoding: 8bit",
  ].filter(Boolean).join("\r\n");

  return `${headers}\r\n\r\n${dotStuff(body)}\r\n.\r\n`;
}

function dotStuff(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function extractEmail(value: string) {
  return value.match(/<([^>]+)>/)?.[1].trim() ?? value.trim();
}

function sanitizeHeader(value: string) {
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

function encodeHeader(value: string) {
  const clean = sanitizeHeader(value);
  return /^[\x00-\x7F]*$/.test(clean) ? clean : `=?UTF-8?B?${base64Utf8(clean)}?=`;
}

function base64Utf8(value: string) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function escapeText(value: string) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}