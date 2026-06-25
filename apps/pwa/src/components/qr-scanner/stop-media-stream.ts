export function stopMediaStream(stream: MediaStream | null | undefined) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

export function releaseVideoElement(video: HTMLVideoElement | null | undefined) {
  if (!video) return;

  if (video.srcObject instanceof MediaStream) {
    stopMediaStream(video.srcObject);
  }

  try {
    video.srcObject = null;
  } catch {
    video.src = '';
  }

  video.removeAttribute('src');
}
