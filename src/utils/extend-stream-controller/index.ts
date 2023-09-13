export type ChunksOptions = {
  chunk: string;
  suspenseId?: number;
  isEndOfTag?: boolean;
  isOpenOfTag?: boolean;
};

export type Controller = {
  enqueue(chunksOptions: ChunksOptions): void;
  nextSuspenseIndex(): number;
};

type SuspenseContent = {
  chunk: string;
  openTags: number;
  closeTags: number;
};

const defaultSuspensedContent: SuspenseContent = {
  chunk: "",
  openTags: 0,
  closeTags: 0,
};

export default function extendStreamController(
  controller: ReadableStreamDefaultController<string>,
): Controller {
  const suspensed = new Map<number, SuspenseContent>();
  let suspenseIndex = 0;

  return {
    enqueue({ chunk, suspenseId, isEndOfTag, isOpenOfTag }: ChunksOptions) {
      if (!suspenseId) {
        controller.enqueue(chunk);
        return;
      }

      let suspensedChunkContent = suspensed.get(suspenseId);

      if (!suspensedChunkContent) {
        suspensedChunkContent = { ...defaultSuspensedContent };
        suspensed.set(suspenseId, suspensedChunkContent);
      }

      if (isOpenOfTag) suspensedChunkContent.closeTags++;
      if (isEndOfTag) suspensedChunkContent.openTags++;

      if (isEndOfTag && isReadyToFlush(suspensedChunkContent)) {
        const finalChunk =
          suspensedChunkContent.chunk +
          chunk +
          `<script>u$('${suspenseId}')</script>`;

        controller.enqueue(finalChunk);
        suspensed.delete(suspenseId);
        return;
      }

      suspensedChunkContent.chunk += chunk;
      suspensed.set(suspenseId, suspensedChunkContent);
    },
    nextSuspenseIndex() {
      return ++suspenseIndex;
    },
  };
}

function isReadyToFlush(chunkContent: SuspenseContent) {
  return chunkContent.closeTags === chunkContent.openTags;
}
