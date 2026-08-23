export function clampTime(time: number, duration: number): number {
  if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return Math.min(Math.max(time, 0), duration);
}

export function horizontalPositionToTime(
  horizontalPosition: number,
  timelineWidth: number,
  duration: number,
): number {
  if (
    !Number.isFinite(horizontalPosition) ||
    !Number.isFinite(timelineWidth) ||
    timelineWidth <= 0
  ) {
    return 0;
  }

  return clampTime((horizontalPosition / timelineWidth) * duration, duration);
}

export function formatPlaybackTime(time: number): string {
  const safeTime = Number.isFinite(time) && time > 0 ? Math.floor(time) : 0;
  const hours = Math.floor(safeTime / 3600);
  const minutes = Math.floor((safeTime % 3600) / 60);
  const seconds = safeTime % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
