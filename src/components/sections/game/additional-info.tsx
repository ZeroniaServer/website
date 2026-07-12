import Paragraphs from "../../paragraphs";

export default function AdditionalInfo({ slug, body = "" }: { slug: string; body?: string }) {
  return <Paragraphs text={body} slug={slug} />;
}
