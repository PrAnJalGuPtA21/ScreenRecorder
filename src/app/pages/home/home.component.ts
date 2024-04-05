import { Component, ElementRef, ViewChild } from '@angular/core';
import RecordRTC from "recordrtc";
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  recorder: any;
  recordedVideoURL: string | null = null;

  constructor(private elementRef: ElementRef) {
    if (!(navigator as any).getDisplayMedia && !navigator.mediaDevices.getDisplayMedia) {
      const error = 'Your browser does NOT support the getDisplayMedia API.';
      const h1Element = this.elementRef.nativeElement.querySelector('h1');
      if (h1Element) {
        h1Element.innerHTML = error;
      }
      (document.getElementById('btn-start-recording') as HTMLButtonElement).style.display = 'none';
      (document.getElementById('btn-stop-recording') as HTMLButtonElement).style.display = 'none';
      throw new Error(error);
    }
  }

  invokeGetDisplayMedia(success: (stream: MediaStream) => void, error: (err: Error) => void) {
    const displayMediaStreamConstraints: MediaStreamConstraints = {
      video: true
    };

    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
    } else {
      (navigator as any).getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
    }
  }

  startRecording() {
    (document.getElementById('btn-start-recording') as HTMLButtonElement).disabled = true;
    this.captureScreen(screen => {
      this.videoElement.nativeElement.srcObject = screen;

      this.recorder = new RecordRTC(screen, {
        type: 'video'
      });

      this.recorder.startRecording();

      // release screen on stopRecording
      this.recorder.screen = screen;

      (document.getElementById('btn-stop-recording') as HTMLButtonElement).disabled = false;
    });
  }

  stopRecording() {
    (document.getElementById('btn-stop-recording') as HTMLButtonElement).disabled = true;
    this.recorder.stopRecording(this.stopRecordingCallback.bind(this));
  }

  captureScreen(callback: (stream: MediaStream) => void) {
    this.invokeGetDisplayMedia(screen => {
      this.addStreamStopListener(screen, () => {
        (document.getElementById('btn-stop-recording') as HTMLButtonElement).click();
      });
      callback(screen);
    }, error => {
      console.error(error);
      alert('Unable to capture your screen. Please check console logs.\n' + error);
    });
  }

  stopRecordingCallback() {
    this.videoElement.nativeElement.src = '';
    this.videoElement.nativeElement.srcObject = null;

    const blob = this.recorder.getBlob();
    this.recordedVideoURL = URL.createObjectURL(blob);
    console.log(this.recordedVideoURL);
    this.videoElement.nativeElement.src = this.recordedVideoURL;
    this.videoElement.nativeElement.play();

    this.recorder.screen.stop();
    this.recorder.destroy();
    this.recorder = null;

    (document.getElementById('btn-start-recording') as HTMLButtonElement).disabled = false;
  }

  addStreamStopListener(stream: MediaStream, callback: () => void) {
    stream.addEventListener('ended', () => {
      callback();
    }, false);
    stream.addEventListener('inactive', () => {
      callback();
    }, false);
    stream.getTracks().forEach(track => {
      track.addEventListener('ended', () => {
        callback();
      }, false);
      track.addEventListener('inactive', () => {
        callback();
      }, false);
    });
  }
}
