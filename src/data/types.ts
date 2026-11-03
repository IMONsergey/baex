/** Editorial content is independent from the reference site's CMS and runtime. */
export interface MediaRef {
  assetKey: string;
  sourceUrl: string;
  kind: "image" | "video";
  name: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface InternalLink {
  label: string;
  path: string;
}

export interface ExternalLink {
  label: string;
  url: string;
}

export interface Office {
  city: string;
  country: string;
  address: string[];
  timeZone: string;
}

export interface Testimonial {
  name: string;
  role: string;
  nameParts: string[];
  /** An editorial paraphrase, never a verbatim quotation. */
  summary: string;
  attributionType: "paraphrase";
  portrait: MediaRef | null;
}

export interface ProjectAward {
  name: string;
  entries: string[];
}

export interface Project {
  slug: string;
  path: string;
  title: string;
  reference: true;
  sourceUrl: string;
  heroCaption: string;
  summary: string;
  introductionParagraphs: string[];
  roles: string[];
  hero: MediaRef;
  gallery: MediaRef[];
  nextProjectSlug: string;
  nextProjectImage: MediaRef | null;
  awards: ProjectAward[];
  externalUrl?: string;
  testimonial?: Testimonial;
}

export type WorkSlide =
  | { type: "project"; projectSlug: string; thumbnail: MediaRef }
  | { type: "statement"; text: string };

export interface ContentRoute {
  path: string;
  type: "home" | "work" | "about" | "services" | "contact" | "project" | "legal";
  title: string;
  projectSlug?: string;
}

export interface TextSection {
  title: string;
  body: string;
}

export interface NextPage extends InternalLink {
  title: string;
}

export interface GlanceCard {
  id: string;
  variant: "defaultWidget" | "autoScrollValue" | "drive";
  title: string;
  size: "small" | "medium" | "full";
  theme: "dark" | "light";
  logos: MediaRef[];
  background?: MediaRef;
  items?: string[];
  link?: InternalLink;
  value?: number;
  subtitle?: string;
}

export interface Person {
  name: string;
  role: string;
  portrait: MediaRef;
}

export interface EngagementModel {
  id: "classic" | "venture";
  title: string;
  subtitle: string;
  headline: string;
  description: string;
  metrics: {
    logo: MediaRef | null;
    sector: string;
    value: string;
    stages: string[];
  }[];
}

export interface WebsiteContent {
  schemaVersion: number;
  edition: {
    mode: "reference";
    sourceBrand: string;
    sourceUrl: string;
    capturedAt: string;
    adaptationTarget: string;
    copy: string;
  };
  site: {
    name: string;
    tagline: string;
    nav: InternalLink[];
    socials: ExternalLink[];
    businessEmail: string;
    careersEmail: string;
    offices: Office[];
    footerTitle: string;
    newsletter: {
      enabled: false;
      label: string;
      placeholder: string;
      endpoint: null;
      successMessage: null;
    };
    reel: MediaRef;
  };
  routes: ContentRoute[];
  home: {
    hero: {
      left: string;
      right: string;
      reelLabel: string;
      desktopVideo: MediaRef;
      mobileVideo: MediaRef;
    };
    intro: string;
    keyValue: TextSection & { link: InternalLink };
    selectedTitle: string;
    selected: {
      projectSlug: string;
      large: boolean;
      thumbnail: MediaRef;
      hoverVideo: MediaRef;
      logo: MediaRef;
    }[];
    logos: MediaRef[];
    reel: MediaRef;
    glanceTitle: string;
    glanceCards: GlanceCard[];
    approachTitle: string;
    approach: TextSection[];
    next: NextPage;
  };
  work: {
    intro: string;
    projectOrder: string[];
    slides: WorkSlide[];
  };
  projects: Project[];
  about: {
    intro: string;
    principlesTitle: string;
    principlesSummary: string;
    principles: (TextSection & { number: string })[];
    awardsTitle: string;
    awardsCount: number;
    awards: { name: string; count: number }[];
    bigMedia: MediaRef | null;
    statement: string;
    founder: Person & { summary: string; links: ExternalLink[] };
    partners: Person[];
    approachTitle: string;
    approach: TextSection[];
    approachMedia: MediaRef[];
    collaborationStatement: string;
    teamTitle: string;
    teamGallery: MediaRef[];
    careers: { label: string; email: string };
  };
  services: {
    intro: string;
    capabilities: { number: string; title: string; items: string[] }[];
    bigMedia: MediaRef | null;
    modelsTitle: string;
    models: EngagementModel[];
    testimonialsTitle: string;
    testimonials: Testimonial[];
    faqTitle: string;
    faqs: { question: string; answer: string }[];
    contact: InternalLink;
  };
  contact: {
    intro: string;
    title: string;
    channels: { label: string; email: string }[];
    offices: Office[];
    workImage: MediaRef | null;
    next: NextPage;
  };
  legal: {
    title: string;
    paragraphs: string[];
    sourceTermsUrl: string;
  };
}
