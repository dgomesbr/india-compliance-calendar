// Validates everything under data/. Exits non-zero on any error.
//   node scripts/validate-data.ts

import { loadEvents, loadHolidays, loadRules } from '../src/lib/load.ts';
import { validateEvents, validateHolidays, validateRules } from '../src/lib/validate.ts';

const rules = loadRules();
const errors = [...validateRules(rules), ...validateHolidays(loadHolidays()), ...validateEvents(loadEvents(), rules)];
for (const e of errors) console.error(`- ${e}`);
console.log(`${rules.length} rules checked, ${errors.length} problems`);
process.exit(errors.length ? 1 : 0);
