import { MediaImage, type PublicCard, type PublicMedia, type PublicSeoContext } from "@neton/application-client-runtime/public";

interface ItemView { id: string; title: string; cover?: PublicMedia | null }

/** `fixture.item` 的卡片：标题链接 + 缩略图（3:2 占位；首屏前几张不懒加载）。 */
export default function ItemCard({ card, eager }: { card: PublicCard; style?: string; eager?: boolean; ctx: PublicSeoContext }) {
  const view = card.view as ItemView;
  return (
    <article data-testid="card" data-id={view.id}>
      {view.cover && <MediaImage media={view.cover} alt="" aspect="3:2" displayWidth={180} priority={eager} />}
      <h2><a href={`/item/${view.id}`}>{view.title}</a></h2>
    </article>
  );
}
