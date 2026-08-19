import type { Product } from "@/types/content";

type ImageBoxProps = Product;

/**
 * `.ad-image-box` — the site's core content block: capped image header over a
 * title + prose body. Hovering scales the image by 1.04.
 *
 * The image is lazy and carries its intrinsic size. This block never appears
 * above the fold, so eagerly fetching it only competed with content the
 * visitor could actually see; the dimensions let the browser reserve the space
 * before the file lands, so nothing jumps when it does.
 */
export default function ImageBox({ title, description, image, alt }: ImageBoxProps) {
  return (
    <article className="ad-image-box ad-observe">
      <div className="image-box-header">
        <img
          src={image}
          alt={alt}
          width={900}
          height={600}
          loading="lazy"
          decoding="async"
        />
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
