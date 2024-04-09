/**
 * ! Executing this script will delete all data in your database and seed it with 10 versions.
 * ! Make sure to adjust the script to your needs.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.mts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { createSeedClient, profilesScalars } from "@snaplet/seed";
import { copycat, faker } from "@snaplet/copycat";
import { createClient } from '@supabase/supabase-js'
import { Tables } from './types/supabase'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABSE_ROLE_KEY!
);

const seed = await createSeedClient({
  dryRun: Boolean(process.env.DRY),
  models: {
    names: {
      data: {
        description: () => faker.company.catchPhrase(),
        name: () => faker.company.name(),
        min_length: ({seed}) => copycat.int(seed, {min: 5, max: 8}),
        max_length: ({seed, data}) => copycat.int(seed, {min: data.min_length ?? 8 + 1, max: 15}),
        favorited: ({seed}) => copycat.bool(seed),
      },
    },
    domains: {
      data: {
        domain_name: faker.internet.domainName(),
        purchase_link: ({ data }) => `https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=${data.domain_name}`,
      }
    },
    logos: {
      data: {
        logo_url: faker.image.urlLoremFlickr({category: 'logo'}),
      }
    },
  }
});

await seed.$resetDatabase();

// We create 11 test users with the same password that we can connect to
const PASSWORD = "testuser";
for (let i = 0; i < 11; i++) {
  const email = copycat.email(i).toLowerCase();
  const fullName = copycat.fullName(i);
  const userName = copycat.username(i);
  
  await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    user_metadata: {
      name: fullName,
      user_name: userName,
    },
    email_confirm: true,
  });
}

const { data: databaseProfiles } = await supabase.from("profiles").select('*').returns<Array<Tables<'profiles'>>>();

// We get all the profiles from the database so we can connect them to the names
const profilesPool: profilesScalars[] = databaseProfiles?.map(profile => ({
  id: profile.id,
  email: profile.email,
  created_at: profile.created_at,
  updated_at: profile.updated_at,
  name: null,
})) ?? [];

// Create a total of 263 names favorited by some of the users
await seed.names(x => x(263, ({ seed }) => {
  const companyName = faker.company.name()
  const internetFriendlyName = companyName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-')
  // We select a random profile from the pool randomly
  const randomProfile = copycat.oneOf(seed, profilesPool)
  // Custom funciton to connect all our data to the same profile we selected above
  const profiles = ({connect}) => connect(() => randomProfile)
  return {
    name: companyName,
    // Randomly mark the name as favorited or not
    // favorited: ({seed}) => copycat.oneOf(seed, [true, false]),
    // we connect the name to a random profile we selected above
    profiles,
    npm_names: [{
      npm_name: `npm i ${internetFriendlyName.toLowerCase()}`,
      purchase_link: `https://www.npmjs.com/package/${internetFriendlyName}`,
      // we use the same profile for the npm_name for consistency
      profiles,
    }],
    domains: [{
      profiles,
      domain_name: `${internetFriendlyName.toLowerCase()}.com`,
      purchase_link: `https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=${internetFriendlyName.toLowerCase()}.com`,
    }],
    logos: [{}]
  }
}), {connect: { profiles: profilesPool }});

if (Boolean(process.env.DRY) === false) {
  console.log("Database seeded successfully.");
  console.log("You can log with the following users:");
  console.log(profilesPool.map(profile => `Email: ${profile.email}, Password: ${PASSWORD}`).join("\n"));
}

process.exit();