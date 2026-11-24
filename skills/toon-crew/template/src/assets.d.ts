// Font files imported from code become the URL the bundler serves them at.
declare module '*.woff2' {
  const url: string;
  export default url;
}
