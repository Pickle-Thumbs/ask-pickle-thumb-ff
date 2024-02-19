import OpenAI from "openai";
import { OpenAIStream } from "ai";
import { Suspense } from "react";
import { Metadata, ResolvingMetadata } from "next";

export const runtime = "edge";

type Props = {
  searchParams: { [key: string]: string };
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata | null> {
  // Removed the stream: true, to not use streaming API
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content:
          searchParams["prompt"] ?? "Give me code for generating a JSX button",
      },
    ],
  });

  // Assuming the API response structure, directly access the text without streaming
  if (response && response.choices && response.choices.length > 0) {
    const text = response.choices[0].message.content as string; // Adjusted to non-stream API response handling

    const fcMetadata: Record<string, string> = {
      "fc:frame": "vNext",
      "fc:frame:post_url": `${process.env["HOST"]}?prompt=${encodeURIComponent(
        searchParams.prompt
      )}`,
      "fc:frame:image": `${process.env["HOST"]}/${encodeURIComponent(text)}`,
      "fc:frame:input:text": "What are your gardening questions?",
      "fc:frame:button:1": "Ask",
    };

    return {
      title: searchParams.prompt,
      openGraph: {
        title: searchParams.prompt,
        images: [`/${encodeURIComponent(JSON.stringify(text))}`],
      },
      other: {
        ...fcMetadata,
      },
      metadataBase: new URL(process.env["HOST"] || ""),
    };
  }

  return null;
}

export default async function Page({
  searchParams,
}: {
  // note that using searchParams opts your page into dynamic rendering. See https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
  searchParams: Record<string, string>;
}) {
  // Request the OpenAI API for the response based on the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [
      {
        role: "user",
        content:
          searchParams["prompt"] ?? "Give me code for generating a JSX button",
      },
    ],
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  const reader = stream.getReader();

  // We recursively render the stream as it comes in
  return (
    <Suspense>
      <Reader reader={reader} />
    </Suspense>
  );
}

async function Reader({
  reader,
}: {
  reader: ReadableStreamDefaultReader<any>;
}) {
  const { done, value } = await reader.read();

  if (done) {
    return null;
  }

  const text = new TextDecoder().decode(value);

  return (
    <span>
      {text}
      <Suspense>
        <Reader reader={reader} />
      </Suspense>
    </span>
  );
}
