import Footer from "@/components/layout/Footer";
import Nav from "@/components/layout/Nav";
import SkipLink from "@/components/layout/SkipLink";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
import Products from "@/components/sections/Products";
import Work from "@/components/sections/Work";
import ScrollReveal from "@/components/ui/ScrollReveal";
import * as content from "@/data/content";

/**
 * The landing page — six blocks assembled from components and fed entirely
 * from src/data/content.json.
 */
export default function Home() {
  return (
    <>
      <SkipLink label={content.nav.skipLink} />
      <Nav nav={content.nav} site={content.site} />

      <main id="content">
        <Hero hero={content.hero} />
        <About about={content.about} />
        <Products products={content.products} />
        <Work work={content.work} />
        <Contact contact={content.contact} social={content.social} />
      </main>

      <Footer
        footer={content.footer}
        site={content.site}
        social={content.social}
        phones={content.contact.phones}
        email={content.contact.email}
        emailHref={content.contact.emailHref}
      />

      <ScrollReveal />
    </>
  );
}
