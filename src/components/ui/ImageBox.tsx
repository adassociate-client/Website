import type { Product } from "@/types/content";

type ImageBoxProps = Product;

/**
 * `.ad-image-box` — the site's core content block: capped image header over a
 * title + prose body. Hovering scales the image by 1.04.
 */
export default function ImageBox({ title, description, image, alt }: ImageBoxProps) {
  return (
    <article className="ad-image-box ad-observe">
      <div className="image-box-header">
        <img src={image} alt={alt} />
      </div>
      <div className="image-box-body">
        <h3 className="body-title">{title}</h3>
        <div className="body-description">
          <p>{description}</p>
        </div>
      </div>
    </article>
  );
}
