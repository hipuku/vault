// Type the names dataset as a plain map so TS doesn't infer a 31,900-key
// literal (which is pathologically slow). Vite handles the actual JSON import.
declare module '*colornames.json' {
  const data: Record<string, string>
  export default data
}
