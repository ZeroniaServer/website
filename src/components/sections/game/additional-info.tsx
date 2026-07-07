import Paragraphs from "../../paragraphs";

export default function AdditionalInfo({ body = "" }: { body?: string }) {
  return <Paragraphs text={body} />;
}
