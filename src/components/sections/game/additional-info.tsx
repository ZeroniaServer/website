import CustomMarkdown from "../../custom-markdown";

export default function AdditionalInfo({ slug, body = "" }: { slug: string; body?: string }) {
  return <CustomMarkdown text={body} slug={slug} />;
}
