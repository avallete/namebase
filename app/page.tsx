/**
 * v0 by Vercel.
 * @see https://v0.dev/t/RYcnF4FO222
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (data.user) {
    // redirect("/new");
    console.log(data.user);
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-6xl font-extrabold leading-tight">
          Effortless startup names, generated by AI
        </h1>
        <p className="mt-4 max-w-2xl text-xl">
          Namebase helps founders generate creative and relevant name ideas for
          their next startup.
        </p>
        <Link href="/new">
          {" "}
          <Button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white  py-2 px-4 rounded">
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}
