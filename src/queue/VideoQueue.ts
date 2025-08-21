import Video from "./Video";

/**
 * Represents a queue for video playback, managing a history of videos,
 * pointer for the current playback position, and looping functionality.
 */
export default class VideoQueue {
    public loop: boolean = false;
    private history: Video[] = [];
    private pointer = -1;

    /**
     * Gets the current position of the pointer.
     *
     * @return {number} The current pointer position.
     */
    public get pointerPosition(): number {
        return this.pointer + 1;
    }

    /**
     * Retrieves the total number of entries in the history.
     *
     * @return {number} The count of entries stored in the history.
     */
    public get historyLength(): number {
        return this.history.length;
    }

    /**
     * Retrieves the current length, calculated as the total history length minus the pointer position.
     *
     * @return {number} The resulting length calculated from the history and pointer.
     */
    public get length(): number {
        return this.history.length - this.pointer;
    }

    /**
     * Determines whether there is a next element available for iteration or navigation.
     *
     * @return {boolean} True if there is a next element, false otherwise.
     */
    public get hasNext(): boolean {
        return this.isLooping || this.pointer < this.history.length - 1;
    }

    /**
     * Determines whether the collection is empty.
     *
     * @return {boolean} Returns true if the collection has no elements, otherwise false.
     */
    public get isEmpty(): boolean {
        return this.length === 0;
    }

    /**
     * Determines whether the history is empty.
     */
    public get historyIsEmpty(): boolean {
        return this.history.length === 0;
    }

    /**
     * Determines whether the queue is currently looping.
     */
    public get isLooping() {
        return this.loop;
    }

    /**
     * Determines whether there is a previous element available for iteration or navigation.
     */
    public get hasPrevious(): boolean {
        return this.pointer > 0;
    }

    /**
     * Retrieves the current video in the queue, or undefined if the queue is empty or the pointer is out of bounds.
     */
    public get current(): Video | undefined {
        return this.pointer >= 0 && this.pointer < this.history.length
            ? this.history[this.pointer]
            : undefined;
    }

    /**
     * Adds a video to the queue.
     *
     * @param {Video} video - The video to be added to the queue.
     *
     * @return {VideoQueue} The current instance of the queue.
     */
    public add(video: Video): VideoQueue {
        this.history.push(video);
        return this;
    }

    /**
     * Adds a video to the queue, placing it as the current video to be played next.
     *
     * @param {Video} video - The video to be added as the current video.
     *
     * @return {VideoQueue} The current instance of the queue.
     */
    public addAsCurrent(video: Video): VideoQueue {
        if (this.historyIsEmpty) {
            this.history.push(video);
        } else {
            this.history.splice(this.pointerPosition, 0, video);
        }

        return this;
    }

    /**
     * Removes a video from the queue based on its ID.
     *
     * @param {string} videoId - The ID of the video to be removed.
     *
     * @return {VideoQueue} The current instance of the queue.
     */
    public remove(videoId: string): VideoQueue {
        this.history = this.history.filter(v => v.id !== videoId);
        return this;
    }

    /**
     * Moves the pointer to the next element in the queue.
     *
     * @return {Video} The next video in the queue, or undefined if there are no more elements.
     */
    public next(): Video | undefined {
        if (this.hasNext) {
            this.pointer++;
            return this.history[this.pointer];
        } else if (this.loop && !this.historyIsEmpty) {
            this.pointer = 0;
            return this.history[this.pointer];
        } else {
            return undefined;
        }
    }

    /**
     * Moves the pointer to the previous element in the queue.
     *
     * @return {Video} The previous video in the queue, or undefined if there are no more elements.
     */
    public previous(): Video | undefined {
        if (this.pointer > 0) {
            this.pointer--;
            return this.history[this.pointer];
        } else if (this.loop && !this.historyIsEmpty) {
            this.pointer = this.historyLength - 1;
            return this.history[this.pointer];
        } else {
            return undefined;
        }
    }

    /**
     * Clears the entire queue.
     */
    public clear() {
        this.history = [];
        this.pointer = -1;
    }

    /**
     * Creates an array of embeds representing the current queue.
     */
    public nextToEmbeds() {
        return this.embedsFrom(this.pointerPosition);
    }

    /**
     * Creates an array of embeds representing the entire history of videos.
     */
    public historyToEmbeds() {
        return this.embedsFrom(0);
    }

    private embedsFrom(position: number) {
        return this.history.slice(position)
            .map(v => v.toEmbed());
    }
}