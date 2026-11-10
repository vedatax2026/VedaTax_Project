using Microsoft.EntityFrameworkCore;
using VedaTax.Api.Models;

namespace VedaTax.Api.Data;

/// <summary>
/// Seeds the three VedaTax services (US, Canada, India Taxation) and their submenu items.
/// Runs on startup only when the countries table is empty, so edits made in the DB are kept.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Countries.AnyAsync()) return;

        db.Countries.AddRange(Us(), Canada(), India());
        await db.SaveChangesAsync();
    }

    public static async Task EnsureAdminAsync(AppDbContext db, Microsoft.AspNetCore.Identity.IPasswordHasher<AppUser> hasher,
        string email, string password)
    {
        email = email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email)) return;
        var admin = new AppUser { FullName = "VedaTax Staff", Email = email, Role = "Admin" };
        admin.PasswordHash = hasher.HashPassword(admin, password);
        db.Users.Add(admin);
        await db.SaveChangesAsync();
    }

    private static TaxService Svc(int order, string slug, string title, string pageTitle, string shortDesc,
        string overview, string howItWorks, string[] prepare, string[] highlights, decimal price, string unit,
        (string q, string a)[] faqs, string? resName = null, string? resUrl = null) => new()
    {
        SortOrder = order,
        Slug = slug,
        Title = title,
        PageTitle = pageTitle,
        ShortDescription = shortDesc,
        Overview = overview,
        HowItWorks = howItWorks,
        WhatToPrepare = prepare.ToList(),
        Highlights = highlights.ToList(),
        StartingPrice = price,
        PriceUnit = unit,
        OfficialResourceName = resName,
        OfficialResourceUrl = resUrl,
        Faqs = faqs.Select((f, i) => new ServiceFaq { Question = f.q, Answer = f.a, SortOrder = i + 1 }).ToList()
    };

    private static Country Us() => new()
    {
        Code = "us", Name = "United States", MenuTitle = "US Taxation", SortOrder = 1,
        Currency = "USD", CurrencySymbol = "$",
        Tagline = "Federal & state returns, ITIN, business and FBAR",
        HeroEyebrow = "For individuals & businesses in the United States",
        HeroTitle = "Your US taxes, simplified.",
        HeroSubtitle = "VedaTax prepares federal and state returns for residents, non-residents and businesses — with ITIN, FBAR/FATCA and cross-border support under a written scope and quotation.",
        Services =
        {
            Svc(1, "individual-tax-filing", "Individual Tax Filing", "US Individual Tax Return Preparation",
                "Form 1040 and 1040-NR returns, federal and state, for W-2 employees, investors and the self-employed.",
                "We prepare federal and state individual returns based on your residency status, income sources and filing status. Whether you are on a work visa, a green-card holder or a citizen living abroad, we start by confirming the correct return type before preparation.",
                "Share a short description of your situation. We confirm the tax year, forms and fee in writing, collect documents through your client portal, prepare the return and walk you through it before e-filing.",
                ["W-2, 1099 (INT, DIV, B, NEC) and 1098 statements", "Prior-year federal and state returns", "Visa history and US entry/exit dates for residency tests", "Dependent details and any education or childcare expenses"],
                ["Resident & non-resident returns", "All 50 states", "Amended returns (1040-X)", "IRS notice support"],
                99, "per federal return",
                [("Do I file a 1040 or a 1040-NR?", "It depends on whether you meet the green-card or substantial-presence test for the year. We review your travel dates and visa history to confirm."),
                 ("Can you file returns for prior years?", "Yes. Late and amended returns can be prepared once we review the records for each year.")],
                "IRS – File your taxes", "https://www.irs.gov/filing"),

            Svc(2, "itin-services", "ITIN Application & Renewal", "ITIN Application & Renewal (Form W-7)",
                "W-7 preparation for spouses and dependents, with Certifying Acceptance Agent guidance.",
                "Spouses and dependents who are not eligible for an SSN may need an Individual Taxpayer Identification Number to be claimed on a return. We prepare Form W-7 alongside the return and explain the identity document options.",
                "We confirm eligibility, prepare the W-7 with the attached return, and advise on document certification so original passports do not need to be mailed where avoidable.",
                ["Passport or other accepted identity documents", "Visa and US entry details", "The federal return the ITIN is attached to"],
                ["New ITIN applications", "Expired ITIN renewals", "Dependent and spouse ITINs"],
                149, "per applicant",
                [("How long does an ITIN take?", "Processing times vary by IRS workload. We share current guidance when we submit your application.")],
                "IRS – ITIN", "https://www.irs.gov/individuals/individual-taxpayer-identification-number"),

            Svc(3, "business-tax", "Business Tax & Accounting", "US Business Tax Returns & Bookkeeping",
                "Form 1120, 1120-S, 1065 and Schedule C, plus bookkeeping and payroll support.",
                "From single-member LLCs to S-corporations and partnerships, we prepare business returns and keep the books that support them. We can also coordinate the owners' individual returns.",
                "We review the entity type, prior filings and accounting records, agree the scope and monthly or annual fee, then reconcile the books and prepare returns ahead of deadlines.",
                ["Formation documents and EIN letter", "Bank and credit-card statements", "Prior-year business returns", "Payroll reports and 1099 contractor details"],
                ["C-corp, S-corp & partnership returns", "Monthly bookkeeping", "Payroll & 1099 filing", "Sales-tax registration guidance"],
                399, "per business return",
                [("Can you take over my books mid-year?", "Yes. We start from your last reconciled month and catch up the records before the next filing.")]),

            Svc(4, "fbar-fatca", "FBAR & FATCA Reporting", "FBAR (FinCEN 114) & FATCA (Form 8938) Reporting",
                "Foreign bank, investment and pension account reporting for US persons.",
                "US persons with financial accounts outside the US may need to report them on FinCEN Form 114 and Form 8938. We review your foreign accounts, balances and income and prepare the required disclosures with your return.",
                "Share a list of your foreign accounts and their highest balances. We confirm which reports apply, convert balances and prepare the filings together with your 1040.",
                ["Foreign bank and investment account statements", "Highest balance for each account during the year", "Foreign income such as interest, rent or dividends"],
                ["FBAR filing", "Form 8938", "Foreign income reporting", "Late-filing guidance"],
                79, "per filing",
                [("Do NRE/NRO accounts in India count?", "Generally yes, foreign accounts are reportable when the aggregate value crosses the threshold. We review your accounts to confirm.")],
                "FinCEN – BSA E-Filing", "https://bsaefiling.fincen.treas.gov/"),

            Svc(5, "tax-planning-us", "Tax Planning & Advisory", "US Tax Planning & Advisory",
                "Year-round planning, estimated taxes, retirement contributions and life-event advice.",
                "Planning ahead helps avoid surprises. We review income, withholding and deductions and suggest steps such as adjusting estimates, retirement contributions or entity choices.",
                "Book a planning session. We review your recent returns and current-year numbers and give you written recommendations.",
                ["Recent returns", "Year-to-date pay stubs and investment summaries", "Major upcoming events (home purchase, move, new business)"],
                ["Withholding & estimate review", "Retirement planning", "Entity selection", "Relocation planning"],
                149, "per session",
                [("Is planning separate from filing?", "Yes, planning is scoped separately, though many clients combine it with their annual return.")]),

            Svc(6, "company-formation", "LLC & Company Formation", "US LLC & Corporation Formation",
                "LLC and corporation setup, EIN, registered agent and annual compliance.",
                "We help residents and non-residents form US entities, obtain an EIN and stay on top of annual reports and franchise taxes.",
                "Tell us the state and ownership structure. We confirm fees, file formation documents, apply for the EIN and set up a compliance calendar.",
                ["Owner identification and addresses", "Preferred company name and state", "Business activity description"],
                ["LLC & C-corp formation", "EIN application", "Registered agent coordination", "Annual report filings"],
                299, "plus state fees",
                [("Can a non-resident form a US LLC?", "Yes. Non-residents can form an LLC; we explain the EIN process and the reporting obligations that follow.")])
        }
    };

    private static Country Canada() => new()
    {
        Code = "ca", Name = "Canada", MenuTitle = "Canada Taxation", SortOrder = 2,
        Currency = "CAD", CurrencySymbol = "C$",
        Tagline = "T1, T2, GST/HST, payroll and newcomer returns",
        HeroEyebrow = "For individuals & businesses in Canada",
        HeroTitle = "Your Canada taxes, simplified.",
        HeroSubtitle = "VedaTax prepares T1 personal and T2 corporate returns, GST/HST filings and payroll slips — and coordinates US–Canada and India–Canada work under one agreed scope.",
        Services =
        {
            Svc(1, "t1-personal-tax", "T1 Personal Tax Returns", "Canada T1 Personal Income Tax Returns",
                "Personal returns for employees, students, families, investors and the self-employed.",
                "We prepare T1 returns using your slips, receipts and residency details, and help you claim credits and benefits you are eligible for.",
                "Share your situation and slips through the client portal. We confirm the fee, prepare the return, review it with you and file through NETFILE/EFILE.",
                ["T4, T4A, T5 and T3 slips", "RRSP and FHSA contribution receipts", "Tuition (T2202), medical and donation receipts", "Prior notice of assessment"],
                ["Employee & student returns", "Self-employment (T2125)", "Rental income (T776)", "Prior-year & adjusted returns"],
                69, "per return",
                [("Can you file returns for past years?", "Yes, we can prepare late returns and request adjustments for earlier years.")],
                "CRA – Personal income tax", "https://www.canada.ca/en/services/taxes/income-tax/personal-income-tax.html"),

            Svc(2, "t2-corporate-filing", "T2 Corporate Filing", "Canada T2 Corporation Income Tax Returns",
                "Year-end T2 returns, financial statements and corporate compliance.",
                "We prepare T2 returns and supporting financial statements for incorporated businesses and holding companies, with GIFI schedules and provincial filings where needed.",
                "We review your year-end, books and prior filings, confirm the scope, then prepare statements and the T2 ahead of the filing deadline.",
                ["Articles of incorporation and business number", "Year-end trial balance or bookkeeping file", "Prior T2 and notice of assessment"],
                ["T2 & provincial returns", "Financial statements", "Shareholder loan review", "Dividend & T5 slips"],
                599, "per corporation",
                [("What if my books are not up to date?", "We can catch up bookkeeping first and include that in the written scope.")]),

            Svc(3, "gst-hst-compliance", "GST/HST Compliance", "GST/HST Registration & Returns",
                "Registration, periodic GST/HST returns and input tax credit reconciliation.",
                "We register businesses for GST/HST when required and prepare monthly, quarterly or annual returns with input tax credit reconciliation.",
                "We confirm your reporting period and records, prepare each return and file before the due date.",
                ["Business number and GST/HST account", "Sales and purchase records for the period", "Prior returns"],
                ["Registration", "Periodic returns", "ITC reconciliation", "Quick method review"],
                99, "per return",
                [("When do I need to register?", "Generally once taxable supplies pass the small-supplier threshold. We check your figures to confirm.")]),

            Svc(4, "payroll-slips", "Payroll, T4 & T5 Slips", "Payroll, T4, T5 & T3 Slips",
                "Payroll runs, source deductions and year-end information slips.",
                "We run payroll, calculate CPP, EI and income tax deductions, and prepare T4, T4A, T5 and T3 slips and summaries at year end.",
                "We set up your payroll schedule, process each pay run and file year-end slips and summaries with the CRA.",
                ["Employee details and TD1 forms", "Pay rates and hours", "Shareholder dividend details for T5"],
                ["Payroll processing", "Source deduction remittances", "T4 / T4A / T5 / T3 slips", "Records of employment"],
                49, "per month",
                [("Can you file slips only, without payroll?", "Yes, year-end slip preparation can be scoped on its own.")]),

            Svc(5, "newcomer-tax", "Newcomers & Non-Residents", "Newcomer, Departure & Non-Resident Returns",
                "First-year, departure and non-resident (Section 216/217) returns.",
                "Moving to or leaving Canada creates specific filing requirements. We establish your residency dates, report world income correctly for the part-year and help with benefit applications.",
                "Share your arrival or departure date and income in both countries. We confirm the return type and prepare it with any elections that apply.",
                ["Arrival or departure date", "World income before and after the move", "Foreign tax paid"],
                ["Newcomer first return", "Departure return", "Non-resident rental (s.216)", "Benefit applications"],
                99, "per return",
                [("Do I report income earned before I arrived?", "It is generally used to calculate certain credits but is not taxed. We explain how it applies to you.")]),

            Svc(6, "us-canada-cross-border", "US–Canada Cross-Border", "US–Canada Cross-Border Tax",
                "Coordinated Canadian and US returns, foreign tax credits and treaty positions.",
                "US citizens in Canada and Canadians with US income face two systems. We prepare both returns together so foreign tax credits and treaty positions line up.",
                "We review both countries' obligations, agree one combined scope and prepare the returns in the right order.",
                ["Canadian slips and prior T1", "US forms (W-2, 1099) and prior 1040", "Foreign account details for FBAR"],
                ["Dual filing", "Foreign tax credits", "Treaty elections", "RRSP/TFSA US reporting"],
                249, "for both returns",
                [("Do I need to report my TFSA to the IRS?", "US persons usually need to consider additional reporting for TFSAs. We review your accounts and explain the options.")])
        }
    };

    private static Country India() => new()
    {
        Code = "in", Name = "India", MenuTitle = "India Taxation", SortOrder = 3,
        Currency = "INR", CurrencySymbol = "₹",
        Tagline = "ITR, NRI & DTAA, GST, TDS and company registration",
        HeroEyebrow = "For individuals, NRIs & businesses in India",
        HeroTitle = "Your India taxes, simplified.",
        HeroSubtitle = "VedaTax handles income tax returns, NRI filing, GST, TDS and company registration — and coordinates US–India and India–Canada work under an agreed scope.",
        Services =
        {
            Svc(1, "itr-filing", "ITR Filing (All Forms)", "India Income Tax Return Filing",
                "ITR-1 to ITR-7 for salary, business, capital gains and foreign income.",
                "We review your income sources — salary, interest, rent, capital gains, business income and overseas assets — to choose the correct ITR form and tax regime, then file accurately and on time.",
                "Tell us your situation. We confirm the assessment year, ITR form and fee, reconcile AIS and Form 26AS with your records, and explain e-verification once filed.",
                ["PAN and Aadhaar details", "Form 16 / 16A, AIS and Form 26AS", "Capital gains statements and property records", "Prior returns"],
                ["ITR-1 to ITR-7", "Old vs new regime comparison", "Revised & belated returns", "Notice responses"],
                999, "per return",
                [("Which ITR form should I use?", "It depends on your income types and residential status, not just your job. We confirm the form after reviewing your records."),
                 ("Do AIS and Form 26AS replace my own documents?", "No. They are reconciled against your source documents so differences can be resolved before filing.")],
                "Income Tax e-Filing portal", "https://www.incometax.gov.in/"),

            Svc(2, "nri-tax-dtaa", "NRI Tax Filing & DTAA", "NRI Tax Filing & DTAA Relief",
                "Indian returns for NRIs, TDS refunds, residency and treaty relief.",
                "NRIs with rent, interest, capital gains or property sales in India often have TDS deducted at high rates. We prepare the Indian return, claim refunds and apply DTAA relief where available.",
                "We build a residency day-count, reconcile TDS from AIS/26AS and coordinate with your US or Canadian return where needed.",
                ["Passport travel dates for residency", "NRO/NRE interest certificates", "Rental and property sale records", "Tax Residency Certificate (TRC) if claiming DTAA"],
                ["Residential status review", "TDS refund claims", "DTAA & Form 10F", "Lower TDS certificate (Form 13)"],
                2499, "per return",
                [("Is NRE interest taxable in India?", "NRE interest is generally exempt for NRIs, while NRO interest is taxable. We confirm based on your residential status.")]),

            Svc(3, "gst-registration-returns", "GST Registration & Returns", "GST Registration & Returns",
                "GST registration, GSTR-1, GSTR-3B, annual returns and reconciliation.",
                "We register your business for GST and file periodic and annual returns, reconciling input tax credit with GSTR-2B.",
                "We confirm your turnover and filing frequency, collect invoices monthly and file returns before due dates.",
                ["PAN, Aadhaar and business address proof", "Sales and purchase invoices", "Bank statements"],
                ["New registration", "GSTR-1 & GSTR-3B", "GSTR-9 annual return", "ITC reconciliation"],
                799, "per month",
                [("Is GST registration mandatory for me?", "It depends on turnover, the type of supply and inter-state sales. We review your business to confirm.")]),

            Svc(4, "tds-compliance", "TDS Compliance", "TDS Returns & Compliance",
                "TDS deduction, 24Q/26Q/27Q returns and Form 16/16A generation.",
                "We calculate TDS on salaries, contractors, rent and payments to non-residents, file quarterly returns and issue certificates.",
                "We set up a monthly deduction and deposit calendar, prepare quarterly returns and generate Form 16 and 16A.",
                ["TAN details", "Payment and deduction details", "Challan records"],
                ["24Q, 26Q & 27Q returns", "Form 16 / 16A", "Correction statements", "Default notice resolution"],
                1499, "per quarter",
                [("What if a TDS return was filed with errors?", "We can file a correction statement and help resolve defaults shown on TRACES.")]),

            Svc(5, "company-registration", "Company Registration", "Company & LLP Registration",
                "Private Limited, LLP and OPC formation, ROC filings and annual compliance.",
                "We guide you through choosing a structure, reserving the name and incorporating, then keep ROC filings and statutory compliance on track.",
                "We confirm structure and fees, prepare incorporation documents, obtain DIN/DSC and file with the MCA.",
                ["Director/partner PAN, Aadhaar and photos", "Registered office proof", "Proposed names and business activity"],
                ["Pvt Ltd, LLP & OPC", "DIN & DSC", "ROC annual filings", "Startup India registration"],
                6999, "plus government fees",
                [("Can an NRI be a director?", "Yes, NRIs can be directors, though at least one director must meet the Indian residency requirement.")]),

            Svc(6, "tax-advisory-planning", "Tax Advisory & Planning", "India Tax Advisory & Planning",
                "Advance tax, tax-saving investments, HUF structuring and audit support.",
                "We help individuals and businesses plan advance tax, choose between tax regimes, structure investments and prepare for audits or scrutiny.",
                "Book a consultation. We review your income and goals and provide written recommendations.",
                ["Recent returns and computation", "Current-year income estimates", "Investment summaries"],
                ["Advance tax planning", "Regime selection", "HUF structuring", "Scrutiny & audit support"],
                1999, "per session",
                [("Can planning reduce my advance tax?", "Planning helps estimate liability accurately and use eligible deductions, which can reduce interest for late payment.")])
        }
    };
}
