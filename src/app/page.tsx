import OpenAI from "openai";
import { OpenAIStream } from "ai";
import { Suspense } from "react";
import { Metadata, ResolvingMetadata } from "next";

export const runtime = "edge";

const PROMPT_TEMPLATE = (
  prompt: string
) => `I want you to answer this gardening question. You are a helpful master gardener that provides advice for home gardeners. Your advice should be limited to five paragraphs.
Your response can be fewer paragraphs. Each paragraph should be no more than 144 characters. Please reply in JSON format and put the total paragraphs in the results in the following formats

{
  reply: {
    message: [
      '',
      '',
      '',
      '',
      '',
    ]
  }
}

Here is the question: ${prompt}`;

type Props = {
  searchParams: { [key: string]: string };
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const prompt = searchParams?.prompt;

  const DEFAULT_METADATA = {
    title: searchParams.prompt,
    openGraph: {
      title: searchParams.prompt,
      images: [`/og.png`],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:post_url": `${process.env["HOST"]}?prompt=${encodeURIComponent(
        searchParams.prompt
      )}`,
      "fc:frame:image": `${process.env["HOST"]}/og.png`,
      "fc:frame:input:text": "Insert a gardening question",
      "fc:frame:button:1": "Ask",
    },
    metadataBase: new URL(process.env["HOST"] || ""),
  };

  if (!prompt) {
    return DEFAULT_METADATA;
  }

  // Removed the stream: true, to not use streaming API
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: PROMPT_TEMPLATE(prompt),
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
      "fc:frame:image": `${process.env["HOST"]}/${encodeURIComponent(
        text
      )}/opengraph-image`,
      "fc:frame:input:text": "Insert a gardening question",
      "fc:frame:button:1": "Ask",
    };

    return {
      title: searchParams.prompt,
      openGraph: {
        title: searchParams.prompt,
        images: [
          `/${encodeURIComponent(JSON.stringify(text))}/opengraph-image`,
        ],
      },
      other: {
        ...fcMetadata,
      },
      metadataBase: new URL(process.env["HOST"] || ""),
    };
  }

  return DEFAULT_METADATA;
}

export default async function Page({
  searchParams,
}: {
  // note that using searchParams opts your page into dynamic rendering. See https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
  searchParams: Record<string, string>;
}) {
  const prompt = searchParams?.prompt;

  if (!prompt) {
    return <div>Welcome</div>;
  }

  // Request the OpenAI API for the response based on the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages: [
      {
        role: "user",
        content: PROMPT_TEMPLATE(prompt),
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
