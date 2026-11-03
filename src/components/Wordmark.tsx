import { createElement } from "react";
import geometry from "../data/wordmark.json";

/** Original vector geometry, exposed as letters for the entrance animation. */
export function Wordmark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox={geometry.viewBox} fill="currentColor" role="img" aria-label="REJOUICE">
    {geometry.elements.map((element, index) => createElement(element.tag, { ...element.attrs, className: "wordmark-letter", key: index }))}
  </svg>;
}

export default Wordmark;
