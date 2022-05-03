## Introduction

Demo online is available
https://cosmic-blini-4ad39d.netlify.app/

This is an adaptation of the extraordinary work done in the proof of concept for embedding Jitsi video and audio conferencing into a react app, available at https://github.com/fpw23/telimed

As described in this repo:

"The main pitfall in react is to not use any Jitsi API ojects as state or props. Instead attach them to the component directly or to the window object and let your components reach them from there. I tried a number of ways to pass them and it would seem to work but then I would get random errors of max state update calls. Instead of passing them as props directly, I found passing a primative repersentation of them worked better. For example, you have audio and video tracks which repersent the Mic and Webcam as API objects. You have to attach these to audio and video html 5 tags for each remote participant. In react world, it made sense to make a remote participant component to display them. The problem is I could not pass the tracks to the component due to the max state errors. The solution was to passed the unique IDs for these objects that look like GUIDs as strings. In the component's did update, when I detected a change in ID I queried the window oject which was created by a parent component for the real API objects and stored them locally on my component but not as state. This let me use react components to break up the display without passing the Lib Meet API objects directly."

### RUN

Commands to execute. Must be executed with HTTPs to enable camera & mic sharing
 
* Windows - set HTTPS=true&&npm start

* OSX / Linux - HTTPS=true npm start

## ISSUES

* Video source switching is currently not working.
* Video re-enable after disabling is not working.