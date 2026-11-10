using Microsoft.EntityFrameworkCore;
using VedaTax.Api.Models;

namespace VedaTax.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<TaxService> TaxServices => Set<TaxService>();
    public DbSet<ServiceFaq> ServiceFaqs => Set<ServiceFaq>();
    public DbSet<Enquiry> Enquiries => Set<Enquiry>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<ClientFiling> Filings => Set<ClientFiling>();
    public DbSet<ClientDocument> Documents => Set<ClientDocument>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Referral> Referrals => Set<Referral>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Country>(e =>
        {
            e.ToTable("countries");
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Code).HasMaxLength(2);
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.MenuTitle).HasMaxLength(100);
            e.Property(x => x.Currency).HasMaxLength(3);
            e.Property(x => x.CurrencySymbol).HasMaxLength(5);
        });

        b.Entity<TaxService>(e =>
        {
            e.ToTable("tax_services");
            e.HasIndex(x => new { x.CountryId, x.Slug }).IsUnique();
            e.Property(x => x.Slug).HasMaxLength(100);
            e.Property(x => x.Title).HasMaxLength(150);
            e.Property(x => x.PageTitle).HasMaxLength(200);
            e.Property(x => x.StartingPrice).HasPrecision(10, 2);
            e.HasOne(x => x.Country).WithMany(c => c.Services).HasForeignKey(x => x.CountryId);
        });

        b.Entity<ServiceFaq>(e =>
        {
            e.ToTable("service_faqs");
            e.HasOne(x => x.TaxService).WithMany(s => s.Faqs).HasForeignKey(x => x.TaxServiceId);
        });

        b.Entity<Enquiry>(e =>
        {
            e.ToTable("enquiries");
            e.Property(x => x.FullName).HasMaxLength(150);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.CountryCode).HasMaxLength(2);
            e.Property(x => x.Status).HasMaxLength(30);
            e.Property(x => x.Message).HasMaxLength(2000);
            e.HasIndex(x => x.Email);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<AppUser>(e =>
        {
            e.ToTable("users");
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.FullName).HasMaxLength(150);
            e.Property(x => x.Role).HasMaxLength(30);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.AlternatePhone).HasMaxLength(30);
        });

        b.Entity<ClientFiling>(e =>
        {
            e.ToTable("client_filings");
            e.HasIndex(x => new { x.UserId, x.CountryCode, x.TaxYear }).IsUnique();
            e.Property(x => x.CountryCode).HasMaxLength(2);
            e.Property(x => x.Status).HasMaxLength(30);
            e.Property(x => x.ConsultantName).HasMaxLength(150);
            e.Property(x => x.ConsultantEmail).HasMaxLength(200);
            e.Property(x => x.ConsultantPhone).HasMaxLength(30);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ClientDocument>(e =>
        {
            e.ToTable("client_documents");
            e.Property(x => x.Category).HasMaxLength(20);
            e.Property(x => x.DocumentType).HasMaxLength(80);
            e.Property(x => x.FileName).HasMaxLength(255);
            e.Property(x => x.StoredName).HasMaxLength(100);
            e.Property(x => x.ContentType).HasMaxLength(150);
            e.Property(x => x.Comments).HasMaxLength(1000);
            e.HasIndex(x => new { x.FilingId, x.Category });
            e.HasOne(x => x.Filing).WithMany(f => f.Documents).HasForeignKey(x => x.FilingId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Invoice>(e =>
        {
            e.ToTable("invoices");
            e.HasIndex(x => x.FilingId).IsUnique();
            e.HasIndex(x => x.InvoiceNumber).IsUnique();
            e.Property(x => x.InvoiceNumber).HasMaxLength(30);
            e.Property(x => x.Currency).HasMaxLength(3);
            e.Property(x => x.Status).HasMaxLength(20);
            e.Property(x => x.ReferralBonus).HasPrecision(10, 2);
            e.HasOne(x => x.Filing).WithOne(f => f.Invoice).HasForeignKey<Invoice>(x => x.FilingId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<InvoiceItem>(e =>
        {
            e.ToTable("invoice_items");
            e.Property(x => x.Description).HasMaxLength(200);
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.HasOne(x => x.Invoice).WithMany(i => i.Items).HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Referral>(e =>
        {
            e.ToTable("referrals");
            e.Property(x => x.Name).HasMaxLength(150);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.HasIndex(x => new { x.ReferrerUserId, x.Email }).IsUnique();
            e.HasOne(x => x.Referrer).WithMany().HasForeignKey(x => x.ReferrerUserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
