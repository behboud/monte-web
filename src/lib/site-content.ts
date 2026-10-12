import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { ImageValue, MediaValue } from "emdash";
import type { PortableTextBlock } from "emdash/client";

export interface ContentEntry<T> {
  id: string;
  slug: string;
  data: T;
}

export interface PageSlide {
  image: ImageValue | null;
}

export interface SectionCard {
  title: string;
  description: string;
  image: ImageValue | null;
  href: string;
}

export interface MealDay {
  date: string;
  main: string;
  side: string;
  dessert: string;
  drink: string;
}

export interface MealPlanData {
  title: string;
  week_start: string;
  days: MealDay[];
  notes: string[];
}

export interface PageData {
  title: string;
  description: string;
  banner_title: string;
  body: PortableTextBlock[];
  slides: PageSlide[];
  section_cards: SectionCard[];
}

export interface NewsTag {
  slug: string;
  label: string;
}

export interface NewsData {
  title: string;
  description: string;
  event_date: string;
  summary: string;
  image: ImageValue | null;
  author_name: string;
  body: PortableTextBlock[];
  terms: { tag: NewsTag[] };
}

export interface SupporterData {
  title: string;
  sort_order: number;
  image: ImageValue | null;
  content: PortableTextBlock[];
}

export interface DonationData {
  title: string;
  sort_order: number;
  image: ImageValue | null;
  content: PortableTextBlock[];
  highlight: boolean;
  url: string;
}

export type SitePage = ContentEntry<PageData>;
export type MealPlan = ContentEntry<MealPlanData>;
export type NewsPost = ContentEntry<NewsData>;
export type Supporter = ContentEntry<SupporterData>;
export type Donation = ContentEntry<DonationData>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function bool(value: unknown): boolean {
  return value === true;
}

function portableText(value: unknown): PortableTextBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((block): block is PortableTextBlock => isRecord(block) && typeof block._type === "string");
}

function repeater(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function mediaValue(value: unknown): MediaValue | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const result: MediaValue = { id: value.id };
  if (typeof value.provider === "string") result.provider = value.provider;
  if (typeof value.src === "string") result.src = value.src;
  if (typeof value.previewUrl === "string") result.previewUrl = value.previewUrl;
  if (typeof value.filename === "string") result.filename = value.filename;
  if (typeof value.mimeType === "string") result.mimeType = value.mimeType;
  if (typeof value.width === "number") result.width = value.width;
  if (typeof value.height === "number") result.height = value.height;
  if (typeof value.focalX === "number") result.focalX = value.focalX;
  if (typeof value.focalY === "number") result.focalY = value.focalY;
  if (typeof value.blurhash === "string") result.blurhash = value.blurhash;
  if (typeof value.dominantColor === "string") result.dominantColor = value.dominantColor;
  if (typeof value.alt === "string") result.alt = value.alt;
  if (isRecord(value.meta)) result.meta = value.meta;
  return result;
}

function imageValue(value: unknown): ImageValue | null {
  const image = mediaValue(value);
  if (!image) return null;
  const darkVariant = mediaValue(isRecord(value) ? value.darkVariant : undefined);
  return darkVariant ? { ...image, darkVariant } : image;
}

function readEntry(value: unknown): { id: string; slug: string; data: UnknownRecord } | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const id = text(value.id);
  const slug = text(value.slug) || text(value.data.slug) || id;
  if (!slug) return null;
  return { id, slug, data: value.data };
}

function readPage(value: unknown): SitePage | null {
  const entry = readEntry(value);
  if (!entry) return null;
  const { data } = entry;
  if (typeof data.title !== "string") return null;

  return {
    id: entry.id,
    slug: entry.slug,
    data: {
      title: text(data.title),
      description: text(data.description),
      banner_title: text(data.banner_title),
      body: portableText(data.body),
      slides: repeater(data.slides).map((row) => ({ image: imageValue(row.image) })),
      section_cards: repeater(data.section_cards).map((row) => ({
        title: text(row.title),
        description: text(row.description),
        image: imageValue(row.image),
        href: text(row.href),
      })),
    },
  };
}

function readMealDay(row: UnknownRecord): MealDay {
  return {
    date: text(row.date),
    main: text(row.main),
    side: text(row.side),
    dessert: text(row.dessert),
    drink: text(row.drink),
  };
}

function readMealPlan(value: unknown): MealPlan | null {
  const entry = readEntry(value);
  if (!entry || typeof entry.data.title !== "string") return null;
  return {
    id: entry.id,
    slug: entry.slug,
    data: {
      title: text(entry.data.title),
      week_start: text(entry.data.week_start),
      days: repeater(entry.data.days).map(readMealDay),
      notes: repeater(entry.data.notes)
        .map((row) => text(row.note))
        .filter(Boolean),
    },
  };
}

function readTerms(value: unknown): NewsTag[] {
  if (!isRecord(value)) return [];
  const tagTerms = value.tag;
  if (!Array.isArray(tagTerms)) return [];
  return tagTerms
    .filter(isRecord)
    .map((term) => ({
      slug: text(term.slug),
      label: text(term.label),
    }))
    .filter((term) => term.slug && term.label);
}

function readPost(value: unknown): NewsPost | null {
  const entry = readEntry(value);
  if (!entry) return null;
  const data = entry.data;
  if (typeof data.title !== "string") return null;
  return {
    id: entry.id,
    slug: entry.slug,
    data: {
      title: text(data.title),
      description: text(data.description),
      event_date: text(data.event_date),
      summary: text(data.summary),
      image: imageValue(data.image),
      author_name: text(data.author_name),
      body: portableText(data.body),
      terms: { tag: readTerms(data.terms) },
    },
  };
}

function readSupporter(value: unknown): Supporter | null {
  const entry = readEntry(value);
  if (!entry) return null;
  const data = entry.data;
  if (typeof data.title !== "string") return null;
  return {
    id: entry.id,
    slug: entry.slug,
    data: {
      title: text(data.title),
      sort_order: number(data.sort_order),
      image: imageValue(data.image),
      content: portableText(data.content),
    },
  };
}

function readDonation(value: unknown): Donation | null {
  const entry = readEntry(value);
  if (!entry) return null;
  const data = entry.data;
  if (typeof data.title !== "string") return null;
  return {
    id: entry.id,
    slug: entry.slug,
    data: {
      title: text(data.title),
      sort_order: number(data.sort_order),
      image: imageValue(data.image),
      content: portableText(data.content),
      highlight: bool(data.highlight),
      url: text(data.url),
    },
  };
}

function throwQueryError(collection: string, error: unknown): never {
  const cause = error instanceof Error ? error : new Error(String(error));
  throw new Error(`Could not read EmDash collection "${collection}": ${cause.message}`, { cause });
}

async function allEntries(collection: string): Promise<unknown[]> {
  const { entries, error } = await getEmDashCollection(collection, { limit: 250 });
  if (error) throwQueryError(collection, error);
  return entries;
}

function mealDateKey(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(date);
}

export async function getMealPlan(): Promise<MealPlan | null> {
  const { entries, error } = await getEmDashCollection("meal_plans", {
    status: "published",
    limit: 250,
    orderBy: { week_start: "desc" },
  });
  if (error) throwQueryError("meal_plans", error);
  const plans = entries.map(readMealPlan).filter((plan): plan is MealPlan => plan !== null);
  if (plans.length === 0) return null;

  const today = mealDateKey(new Date());
  const byNewestWeek = (a: MealPlan, b: MealPlan) => mealDateKey(b.data.week_start).localeCompare(mealDateKey(a.data.week_start)) || Date.parse(b.data.week_start) - Date.parse(a.data.week_start);
  const currentOrPast = plans.filter((plan) => mealDateKey(plan.data.week_start) <= today).toSorted(byNewestWeek);
  return currentOrPast[0] ?? plans.toSorted((a, b) => byNewestWeek(b, a))[0] ?? null;
}

export async function getSitePage(slug: string): Promise<SitePage | null> {
  const { entry, error } = await getEmDashEntry("pages", slug);
  if (error) throwQueryError("pages", error);
  return readPage(entry);
}

export async function getNewsPosts(): Promise<NewsPost[]> {
  const posts = (await allEntries("posts")).map(readPost).filter((post): post is NewsPost => post !== null);
  return posts.toSorted((a, b) => Date.parse(b.data.event_date) - Date.parse(a.data.event_date));
}

export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  const { entry, error } = await getEmDashEntry("posts", slug);
  if (error) throwQueryError("posts", error);
  return readPost(entry);
}

export async function getSupporters(): Promise<Supporter[]> {
  const supporters = (await allEntries("supporters")).map(readSupporter).filter((supporter): supporter is Supporter => supporter !== null);
  return supporters.toSorted((a, b) => a.data.sort_order - b.data.sort_order);
}

export async function getDonations(): Promise<Donation[]> {
  const donations = (await allEntries("donations")).map(readDonation).filter((donation): donation is Donation => donation !== null);
  return donations.toSorted((a, b) => a.data.sort_order - b.data.sort_order);
}

export function formatNewsDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")}`;
}

export function formatMealDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

export function formatMealWeek(days: MealDay[]): string {
  const dates = days.map((day) => new Date(day.date)).filter((date) => !Number.isNaN(date.getTime()));
  if (dates.length === 0) return "Aktuelle Woche";
  dates.sort((a, b) => a.getTime() - b.getTime());
  const first = dates[0];
  const last = dates.at(-1);
  if (!first || !last) return "Aktuelle Woche";
  const dateParts = (date: Date) =>
    new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      timeZone: "Europe/Berlin",
    }).formatToParts(date);
  const value = (date: Date, type: Intl.DateTimeFormatPartTypes) => dateParts(date).find((part) => part.type === type)?.value ?? "";
  const sameMonth = value(first, "month") === value(last, "month") && value(first, "year") === value(last, "year");
  const firstLabel = sameMonth ? `${value(first, "day")}.${value(first, "month")}.` : `${value(first, "day")}.${value(first, "month")}.${value(first, "year")}`;
  const lastLabel = `${value(last, "day")}.${value(last, "month")}.${value(last, "year")}`;
  return `Woche vom ${firstLabel}-${lastLabel}`;
}
