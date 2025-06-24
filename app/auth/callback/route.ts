import { MODEL_DEFAULT } from "@/lib/config"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const animals = [
  { name: 'Bald Eagle', filename: 'Bald Eagle.png' },
  { name: 'Cat', filename: 'Cat.png' },
  { name: 'Chameleon', filename: 'Chameleon.png' },
  { name: 'Cheetah', filename: 'Cheetah.png' },
  { name: 'Cow', filename: 'Cow.png' },
  { name: 'Crocodile', filename: 'Crocodile.png' },
  { name: 'Cub', filename: 'Cub.png' },
  { name: 'Dog', filename: 'Dog.png' },
  { name: 'Dolphine', filename: 'Dolphine.png' },
  { name: 'Elephant', filename: 'Elephant.png' },
  { name: 'Flamingo', filename: 'Flamingo.png' },
  { name: 'Fox', filename: 'Fox.png' },
  { name: 'Giraffe', filename: 'Giraffe.png' },
  { name: 'Goose', filename: 'Goose.png' },
  { name: 'Jaguar', filename: 'Jaguar.png' },
  { name: 'Kangaroo', filename: 'Kangaroo.png' },
  { name: 'Koala', filename: 'Koala.png' },
  { name: 'Lion', filename: 'Lion.png' },
  { name: 'Monkey', filename: 'Monkey.png' },
  { name: 'Octopus', filename: 'Octopus.png' },
  { name: 'Orangutan', filename: 'Orangutan.png' },
  { name: 'Panda', filename: 'Panda.png' },
  { name: 'Parrot', filename: 'Parrot.png' },
  { name: 'Pelican', filename: 'Pelican.png' },
  { name: 'Penguin', filename: 'Penguin.png' },
  { name: 'Raven', filename: 'Raven.png' },
  { name: 'Seal', filename: 'Seal.png' },
  { name: 'Snake', filename: 'Snake.png' },
  { name: 'Squirrel', filename: 'Squirrel.png' },
  { name: 'Tasmanian Devil', filename: 'Tasmanian Devil.png' },
  { name: 'Tiger', filename: 'Tiger.png' },
  { name: 'Turtle', filename: 'Turtle.png' },
  { name: 'Zebra', filename: 'Zebra.png' }
];

function getRandomAnimal() {
  const randomIndex = Math.floor(Math.random() * animals.length);
  const animal = animals[randomIndex];
  return { name: animal.name, image: `/1x1/${animal.filename}` };
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (!isSupabaseEnabled) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Missing authentication code")}`
    )
  }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  if (!supabase || !supabaseAdmin) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth error:", error)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
    )
  }

  const user = data?.user
  if (!user || !user.id || !user.email) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Missing user info")}`
    )
  }

  try {
    const { data: existingUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  
  if (fetchError) {
    throw fetchError
  }
  
  if (existingUser) {
    // User exists, update necessary fields
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ email: user.email, wallet_type: 'google' })
      .eq('id', user.id)
  
    if (updateError) {
      console.error('Error updating user:', updateError)
    }
  } else {
    // User does not exist, create new user
    const randomAnimal = getRandomAnimal()
    const userDisplayName = user.user_metadata?.name || randomAnimal.name
    const userProfileImage =
      user.user_metadata?.avatar_url || randomAnimal.image
  
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: user.id,
      email: user.email,
      display_name: userDisplayName,
      profile_image: userProfileImage,
      created_at: new Date().toISOString(),
      message_count: 0,
      premium: false,
      preferred_model: MODEL_DEFAULT,
      wallet_type: 'google',
      wallet_address: null
    })
  
    if (insertError) {
      console.error('Error inserting user:', insertError)
    }
  }
    if (fetchError) {
      throw fetchError
    }

    if (existingUser) {
      // User exists, update necessary fields
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ email: user.email, wallet_type: 'google' })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user:', updateError)
      }
    } else {
      // User does not exist, create new user
      const randomAnimal = getRandomAnimal()
      const userDisplayName = user.user_metadata?.name || randomAnimal.name
      const userProfileImage =
        user.user_metadata?.avatar_url || randomAnimal.image

      const { error: insertError } = await supabaseAdmin.from('users').insert({
        id: user.id,
        email: user.email,
        display_name: userDisplayName,
        profile_image: userProfileImage,
        created_at: new Date().toISOString(),
        message_count: 0,
        premium: false,
        preferred_model: MODEL_DEFAULT,
        wallet_type: 'google',
        wallet_address: null
      })

      if (insertError) {
        console.error('Error inserting user:', insertError)
      }
    }
  } catch (err) {
    console.error('Unexpected user upsert/insert error:', err)
  }

  const host = request.headers.get("host")
  const protocol = host?.includes("localhost") ? "http" : "https"

  const redirectUrl = `${protocol}://${host}${next}`

  return NextResponse.redirect(redirectUrl)
}
