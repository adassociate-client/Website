import Footer from "@/components/layout/Footer";
import Nav from "@/components/layout/Nav";
import SkipLink from "@/components/layout/SkipLink";
import About from "@/components/sections/About";
import Approach from "@/components/sections/Approach";
import Capabilities from "@/components/sections/Capabilities";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
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
        <Capabilities capabilities={content.capabilities} />
        <Approach approach={content.approach} />
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
