import type { APIRoute, GetStaticPaths } from 'astro';
import { HOLIDAY_FEEDS, holidayFeed, type HolidayFeed } from '../../../lib/feeds.ts';

export const getStaticPaths: GetStaticPaths = () => Object.keys(HOLIDAY_FEEDS).map((region) => ({ params: { region } }));

export const GET: APIRoute = ({ params }) =>
  new Response(holidayFeed(String(params.region) as HolidayFeed), { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
