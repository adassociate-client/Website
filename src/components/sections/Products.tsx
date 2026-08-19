import Eyebrow from "@/components/ui/Eyebrow";
import ImageBox from "@/components/ui/ImageBox";
import Section from "@/components/ui/Section";
import type { Products as ProductsData } from "@/types/content";

interface ProductsProps {
  products: ProductsData;
}

/**
 * The product range, three to a row on a staggered reveal.
 *
 * This block used to be an unlabelled run of cards immediately after About,
 * so it read as part of that section rather than as its own. It now carries
 * the same eyebrow + heading as every other section, and an id the nav can
 * anchor to.
 */
export default function Products({ products }: ProductsProps) {
  return (
    <Section id={products.id} variant="flush">
      <div className="ad-container">
        <Eyebrow>{products.eyebrow}</Eyebrow>
        <h2 style={{ marginBottom: "var(--ad-space-8)" }}>{products.heading}</h2>

        <div className="ad-grid ad-grid--3 ad-stagger">
          {products.items.map((item) => (
            <ImageBox key={item.image} {...item} />
          ))}
        </div>
      </div>
    </Section>
  );
}
