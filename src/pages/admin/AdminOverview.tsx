import AdminLayout from "./AdminLayout";

const AdminOverview = () => {
  return (
    <AdminLayout>
      <h1 className="font-heading text-4xl text-foreground mb-2">Pregled</h1>
      <p className="font-body text-sm text-muted-foreground mb-10">Dobrodošli u admin panel.</p>
      <div className="bg-white border border-border p-8">
        <p className="font-body text-sm text-muted-foreground">
          Faza 1 je završena: baza je postavljena, prijava radi. U Fazi 2 dodajemo statistike, porudžbine, kupce i CSV export.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
