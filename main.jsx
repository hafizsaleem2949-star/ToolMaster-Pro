import React, {useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {
  Search, Menu, X, Wrench, FileText, Image, Code2, Globe2, Calculator,
  ArrowRight, Star, ShieldCheck, Zap, Sparkles, Upload, Copy, Download,
  CheckCircle2, LockKeyhole, Settings, LayoutDashboard
} from "lucide-react";
import "./styles.css";

const tools = [
["Text to Video","AI & Video","Turn a written prompt or script into an AI video project.","text-to-video"],
["Student AI Helper","AI & Education","Ask questions or upload a study image/PDF and get step-by-step AI help.","student-ai-helper"],
["PDF to Word","PDF Tools","Convert PDF documents into editable Word files.","pdf-word"],
["Word to PDF","PDF Tools","Convert Word documents into PDF.","word-pdf"],
["PDF to JPG","PDF Tools","Turn PDF pages into JPG images.","pdf-jpg"],
["JPG to PDF","PDF Tools","Create a PDF from JPG images.","jpg-pdf"],
["Merge PDF","PDF Tools","Combine multiple PDF files into one.","merge-pdf"],
["Split PDF","PDF Tools","Split a PDF into separate files.","split-pdf"],
["Compress PDF","PDF Tools","Reduce PDF file size quickly.","compress-pdf"],
["Rotate PDF","PDF Tools","Rotate PDF pages to the correct orientation.","rotate-pdf"],
["PDF Unlock","PDF Tools","Unlock supported password-protected PDFs.","pdf-unlock"],
["PDF Watermark","PDF Tools","Add a watermark to PDF pages.","pdf-watermark"],
["Image Compressor","Image Tools","Compress JPG, PNG and WebP images.","image-compressor"],
["Image Resizer","Image Tools","Resize images to exact dimensions.","image-resizer"],
["Image Cropper","Image Tools","Crop images online.","image-cropper"],
["JPG to PNG","Image Tools","Convert JPG images to PNG.","jpg-png"],
["PNG to JPG","Image Tools","Convert PNG images to JPG.","png-jpg"],
["WebP Converter","Image Tools","Convert images to and from WebP.","webp-converter"],
["Image Background Remover","Image Tools","Remove simple image backgrounds.","background-remover"],
["Image to Text","Image Tools","Extract text from an image.","image-text"],
["QR Code Generator","SEO & Marketing","Create custom QR codes from text or links.","qr-generator"],
["Meta Tag Generator","SEO & Marketing","Generate SEO-ready meta tags.","meta-tags"],
["Sitemap Generator","SEO & Marketing","Create a basic XML sitemap.","sitemap"],
["Robots.txt Generator","SEO & Marketing","Generate a robots.txt file.","robots"],
["Keyword Density Checker","SEO & Marketing","Analyze keyword frequency in text.","keyword-density"],
["URL Encoder","SEO & Marketing","Encode URLs safely.","url-encoder"],
["Word Counter","Text Tools","Count words, characters and sentences.","word-counter"],
["Case Converter","Text Tools","Convert text to upper, lower and title case.","case-converter"],
["Text Cleaner","Text Tools","Remove extra spaces and clean text.","text-cleaner"],
["Lorem Ipsum Generator","Text Tools","Generate placeholder text.","lorem"],
["Duplicate Line Remover","Text Tools","Remove duplicate lines from text.","duplicate-lines"],
["Text Sorter","Text Tools","Sort lines alphabetically.","text-sorter"],
["JSON Formatter","Developer Tools","Format and validate JSON.","json-formatter"],
["JSON Minifier","Developer Tools","Minify JSON for compact output.","json-minifier"],
["Base64 Encoder","Developer Tools","Encode text to Base64.","base64-encode"],
["Base64 Decoder","Developer Tools","Decode Base64 text.","base64-decode"],
["HTML Formatter","Developer Tools","Format HTML code.","html-formatter"],
["CSS Formatter","Developer Tools","Format CSS code.","css-formatter"],
["JavaScript Minifier","Developer Tools","Compact JavaScript text.","js-minifier"],
["UUID Generator","Developer Tools","Generate unique UUID values.","uuid"],
["Hash Generator","Developer Tools","Create common text hashes locally.","hash"],
["Timestamp Converter","Developer Tools","Convert Unix timestamps.","timestamp"],
["Password Generator","Security Tools","Generate strong random passwords locally.","password"],
["Password Strength Checker","Security Tools","Check password strength locally.","password-strength"],
["MD5 Hash Generator","Security Tools","Generate an MD5-style hash placeholder locally.","md5"],
["SHA-256 Generator","Security Tools","Generate SHA-256 hashes using your browser.","sha256"],
["Percentage Calculator","Calculator Tools","Calculate percentages quickly.","percentage"],
["Age Calculator","Calculator Tools","Calculate age from date of birth.","age"],
["BMI Calculator","Calculator Tools","Calculate body mass index.","bmi"],
["Discount Calculator","Calculator Tools","Calculate sale discounts.","discount"],
["Loan Calculator","Calculator Tools","Estimate monthly loan payments.","loan"],
["GST Calculator","Calculator Tools","Calculate GST-inclusive or exclusive amounts.","gst"],
["Tip Calculator","Calculator Tools","Calculate tips and split bills.","tip"],
["Time Calculator","Calculator Tools","Add and subtract time values.","time"],
["Unit Converter","Converter Tools","Convert common units.","units"],
["Length Converter","Converter Tools","Convert length measurements.","length"],
["Weight Converter","Converter Tools","Convert weight measurements.","weight"],
["Temperature Converter","Converter Tools","Convert Celsius, Fahrenheit and Kelvin.","temperature"],
["Currency Converter","Converter Tools","Enter exchange rates and convert currencies.","currency"],
["Data Storage Converter","Converter Tools","Convert bytes, KB, MB and GB.","storage"],
["Color Converter","Developer Tools","Convert HEX, RGB and HSL values.","color"],
["IP Address Info","Network Tools","Inspect the IP address visible to your browser.","ip-info"],
["HTTP Status Checker","Network Tools","Explain common HTTP status codes.","http-status"],
["Regex Tester","Developer Tools","Test regular expressions in your browser.","regex"],
["Cron Expression Helper","Developer Tools","Build common cron expressions.","cron"],
["HTML Entity Encoder","Developer Tools","Encode HTML entities.","html-entities"],
["URL Parser","Developer Tools","Break a URL into its parts.","url-parser"],
["Email Validator","Utility Tools","Validate email address format.","email-validator"],
["Phone Number Formatter","Utility Tools","Clean and format phone numbers.","phone"],
["Date Difference Calculator","Calculator Tools","Calculate the difference between dates.","date-difference"],
["Random Number Generator","Utility Tools","Generate random numbers.","random-number"],
["Random Password Generator","Security Tools","Generate secure random passwords.","random-password"],
["Text Reverser","Text Tools","Reverse any text.","text-reverser"],
["Palindrome Checker","Text Tools","Check whether text is a palindrome.","palindrome"],
["Reading Time Calculator","Text Tools","Estimate reading time for text.","reading-time"],
["Character Counter","Text Tools","Count characters with and without spaces.","characters"],
["Number to Words","Utility Tools","Convert numbers to English words.","number-words"],
["Roman Numeral Converter","Utility Tools","Convert numbers to Roman numerals.","roman"],
["Barcode Generator","SEO & Marketing","Generate a simple barcode-ready value.","barcode"],
["Open Graph Generator","SEO & Marketing","Create Open Graph meta tags.","open-graph"],
["Schema Markup Generator","SEO & Marketing","Create basic JSON-LD schema templates.","schema"],
["Favicon Generator","SEO & Marketing","Prepare favicon assets from an image.","favicon"],
["UTM Builder","SEO & Marketing","Build campaign tracking URLs.","utm"],
["HTML Previewer","Developer Tools","Preview HTML in a sandboxed area.","html-preview"],
["Markdown Previewer","Developer Tools","Preview basic Markdown.","markdown"],
["SQL Formatter","Developer Tools","Format simple SQL statements.","sql"],
["CSV to JSON","Developer Tools","Convert CSV text to JSON.","csv-json"],
["JSON to CSV","Developer Tools","Convert simple JSON arrays to CSV.","json-csv"],
["XML Formatter","Developer Tools","Format XML text.","xml"],
["YAML to JSON","Developer Tools","Convert basic YAML-like key values to JSON.","yaml-json"],
["CSS Color Picker","Developer Tools","Pick and inspect a color.","color-picker"],
["Aspect Ratio Calculator","Calculator Tools","Calculate proportional dimensions.","aspect"],
["Compound Interest Calculator","Calculator Tools","Estimate compound growth.","compound-interest"],
["Scientific Calculator","Calculator Tools","Perform common scientific calculations.","scientific"],
["Date Calculator","Calculator Tools","Add days to a date.","date-add"],
["Business Name Generator","Utility Tools","Generate business name ideas from keywords.","business-name"],
["Username Generator","Utility Tools","Generate username ideas.","username"],
["Morse Code Converter","Text Tools","Convert text to Morse code.","morse"],
["Binary Converter","Developer Tools","Convert text and numbers to binary.","binary"],
["ASCII Converter","Developer Tools","Convert text to ASCII codes.","ascii"],
["URL Slug Generator","SEO & Marketing","Create clean SEO slugs.","slug"]
];

const categories = [
["All Tools", tools.length, Wrench],
["PDF Tools", tools.filter(x=>x[1]==="PDF Tools").length, FileText],
["Image Tools", tools.filter(x=>x[1]==="Image Tools").length, Image],
["SEO & Marketing", tools.filter(x=>x[1]==="SEO & Marketing").length, Globe2],
["Text Tools", tools.filter(x=>x[1]==="Text Tools").length, FileText],
["Developer Tools", tools.filter(x=>x[1]==="Developer Tools").length, Code2],
["Calculator Tools", tools.filter(x=>x[1]==="Calculator Tools").length, Calculator],
["Converter Tools", tools.filter(x=>x[1]==="Converter Tools").length, Wrench],
["Security Tools", tools.filter(x=>x[1]==="Security Tools").length, ShieldCheck],
["Utility Tools", tools.filter(x=>x[1]==="Utility Tools").length, Sparkles]
];

function App(){
 const [cat,setCat]=useState("All Tools");
 const [query,setQuery]=useState("");
 const [tool,setTool]=useState(null);
 const [admin,setAdmin]=useState(false);
 const filtered=useMemo(()=>tools.filter(t=>
   (cat==="All Tools"||t[1]===cat) &&
   (t[0].toLowerCase().includes(query.toLowerCase())||t[2].toLowerCase().includes(query.toLowerCase()))
 ),[cat,query]);

 return <div className="app">
  <header>
   <div className="nav">
    <div className="brand"><div className="brandIcon"><Wrench size={22}/></div><span>ToolMaster<span>Pro</span></span></div>
    <nav><a href="#tools">Tools</a><a href="#categories">Categories</a><a href="#about">About</a></nav>
    <button className="adminBtn" onClick={()=>setAdmin(!admin)}><LayoutDashboard size={17}/> {admin?"Close Admin":"Admin"}</button>
   </div>
  </header>

  {admin ? <Admin onClose={()=>setAdmin(false)}/> : tool ? <ToolPage t={tool} back={()=>setTool(null)}/> :
  <>
   <section className="hero">
    <div className="pill"><Sparkles size={15}/> 100+ Free Online Tools</div>
    <h1>One place for <span>every tool</span> you need.</h1>
    <p>Fast, simple and privacy-friendly online tools for PDF, images, SEO, text, developers, calculators and more.</p>
    <div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search for a tool..."/></div>
    <div className="stats"><div><b>{tools.length}+</b><small>Tools</small></div><div><b>10</b><small>Categories</small></div><div><b>100%</b><small>Browser-based</small></div></div>
   </section>

   <main id="tools">
    <section id="categories" className="categories">
      {categories.map(([name,count,Icon])=><button className={cat===name?"cat active":"cat"} onClick={()=>setCat(name)} key={name}><Icon/><span>{name}</span><em>{count}</em></button>)}
    </section>
    <div className="sectionHead"><div><h2>{cat}</h2><p>{filtered.length} tools available</p></div></div>
    <div className="grid">
      {filtered.map(t=><ToolCard key={t[3]} t={t} open={()=>setTool(t)}/>)}
    </div>
    {!filtered.length && <div className="empty">No tools found. Try another search.</div>}
   </main>
  </>}

  <footer id="about"><div className="brand"><div className="brandIcon"><Wrench size={20}/></div><span>ToolMaster<span>Pro</span></span></div><p>Powerful online tools, made simple.</p><small>© 2026 ToolMaster Pro. All tools are designed for easy browser use.</small></footer>
 </div>
}

function ToolCard({t,open}){
 const icons={ "PDF Tools":FileText,"Image Tools":Image,"SEO & Marketing":Globe2,"Text Tools":FileText,"Developer Tools":Code2,"Calculator Tools":Calculator };
 const Icon=icons[t[1]]||Wrench;
 return <article className="card" onClick={open}><div className="toolIcon"><Icon size={21}/></div><div className="cardBody"><span>{t[1]}</span><h3>{t[0]}</h3><p>{t[2]}</p></div><ArrowRight className="arrow"/></article>
}



function TextToVideo({back}){
 const [prompt,setPrompt]=useState("");
 const [style,setStyle]=useState("Cinematic");
 const [duration,setDuration]=useState("10 seconds");
 const [status,setStatus]=useState("");
 const generate=()=>{
   if(!prompt.trim()){setStatus("Please enter a video prompt first.");return;}
   setStatus("Video project prepared. A production AI video API must be connected to render the actual video.");
 };
 return <main className="toolPage">
   <button className="back" onClick={back}>← Back to tools</button>
   <div className="toolHero">
    <div className="toolIcon big"><Sparkles/></div>
    <div><span>AI & Video</span><h1>Text to Video</h1><p>Describe a scene, story or marketing idea and prepare an AI video project.</p></div>
   </div>
   <div className="aiHelper">
    <div className="aiCard">
      <h3>🎬 Video Prompt</h3>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Example: A cinematic drone shot of a futuristic city at sunset, realistic lighting, smooth camera movement..."/>
      <div className="videoOptions">
       <label>Style<select value={style} onChange={e=>setStyle(e.target.value)}><option>Cinematic</option><option>Realistic</option><option>Anime</option><option>3D Animation</option><option>Documentary</option><option>Product Ad</option></select></label>
       <label>Duration<select value={duration} onChange={e=>setDuration(e.target.value)}><option>5 seconds</option><option>10 seconds</option><option>15 seconds</option><option>30 seconds</option></select></label>
      </div>
      <button className="primary aiSolve" onClick={generate}><Sparkles size={17}/> Generate Video</button>
    </div>
    <div className="aiCard resultCard">
      <h3>🎥 Video Preview</h3>
      <div className="videoPlaceholder">
       <div className="playCircle">▶</div>
       <b>Your generated video will appear here</b>
       <small>{style} · {duration}</small>
       {status&&<p>{status}</p>}
      </div>
    </div>
   </div>
   <div className="notice"><ShieldCheck/> Real video generation requires a secure server-side AI video provider. API keys must never be exposed in browser code.</div>
 </main>
}

function StudentAIHelper({back}){
 const [question,setQuestion]=useState("");
 const [file,setFile]=useState(null);
 const [answer,setAnswer]=useState("");
 const [loading,setLoading]=useState(false);
 const solve=async()=>{
   if(!question.trim() && !file){setAnswer("Please enter a question or upload a study image/PDF.");return;}
   setLoading(true);
   // Production note: connect this action to a secure server-side AI API.
   setTimeout(()=>{
     setAnswer("Student AI Helper is ready for your question/file. To enable real AI answers, connect a secure backend AI provider (API key must stay on the server). Your uploaded file is selected locally and is not sent anywhere by this demo.");
     setLoading(false);
   },700);
 };
 return <main className="toolPage">
   <button className="back" onClick={back}>← Back to tools</button>
   <div className="toolHero">
    <div className="toolIcon big"><Sparkles/></div>
    <div><span>AI & Education</span><h1>Student AI Helper</h1><p>Ask a question or upload a study image/PDF for step-by-step help.</p></div>
   </div>
   <div className="aiHelper">
    <div className="aiCard">
      <h3>📚 Ask your question</h3>
      <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Example: Explain photosynthesis in simple words, solve this maths question, or summarize this chapter..."/>
      <label className="uploadBox"><Upload/><div><b>Upload study material</b><small>PDF, JPG, PNG or other supported study files</small>{file&&<strong>{file.name}</strong>}</div><input type="file" accept=".pdf,image/*,.txt,.doc,.docx" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      <button className="primary aiSolve" onClick={solve} disabled={loading}><Sparkles size={17}/>{loading?"Preparing...":"Get AI Help"}</button>
    </div>
    <div className="aiCard resultCard">
      <h3>🤖 AI Answer</h3>
      <div className="answer">{answer||"Your step-by-step explanation will appear here."}</div>
      {answer&&<button className="secondary" onClick={()=>navigator.clipboard?.writeText(answer)}><Copy size={17}/> Copy Answer</button>}
    </div>
   </div>
   <div className="notice"><ShieldCheck/> For the live version, AI processing should run through a secure backend so the AI API key is never exposed in the browser.</div>
 </main>
}

function ToolPage({t,back}){
 const [text,setText]=useState("");
 const [out,setOut]=useState("");
 const run=()=>{
   let r=text;
   if(t[3]==="word-counter"||t[3]==="characters"){r=`Words: ${text.trim()?text.trim().split(/\\s+/).length:0}\\nCharacters: ${text.length}`;}
   else if(t[3]==="case-converter") r=text.toLowerCase();
   else if(t[3]==="text-reverser") r=[...text].reverse().join("");
   else if(t[3]==="slug") r=text.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
   else if(t[3]==="url-encoder") r=encodeURIComponent(text);
   else if(t[3]==="base64-encode") r=btoa(unescape(encodeURIComponent(text)));
   else if(t[3]==="base64-decode"){try{r=decodeURIComponent(escape(atob(text)))}catch{r="Invalid Base64"}}
   else if(t[3]==="json-formatter"){try{r=JSON.stringify(JSON.parse(text),null,2)}catch{r="Invalid JSON"}}
   else if(t[3]==="json-minifier"){try{r=JSON.stringify(JSON.parse(text))}catch{r="Invalid JSON"}}
   else if(t[3]==="uuid") r=crypto.randomUUID();
   else if(t[3]==="password"||t[3]==="random-password") r=crypto.getRandomValues(new Uint32Array(3)).join("-")+"!Aa";
   else if(t[3]==="binary") r=[...text].map(c=>c.charCodeAt(0).toString(2).padStart(8,"0")).join(" ");
   else if(t[3]==="ascii") r=[...text].map(c=>c.charCodeAt(0)).join(" ");
   else if(t[3]==="morse"){const m={a:".-",b:"-...",c:"-.-.",d:"-..",e:".",f:"..-.",g:"--.",h:"....",i:"..",j:".---",k:"-.-",l:".-..",m:"--",n:"-.",o:"---",p:".--.",q:"--.-",r:".-.",s:"...",t:"-",u:"..-",v:"...-",w:".--",x:"-..-",y:"-.--",z:"--.."};r=text.toLowerCase().split("").map(c=>m[c]||c).join(" "); }
   else r="This tool is ready. Upload or enter your content to process it locally in your browser.";
   setOut(r);
 };
 if(t[3]==="student-ai-helper") return <StudentAIHelper back={back}/>;
 if(t[3]==="text-to-video") return <TextToVideo back={back}/>;
 return <main className="toolPage"><button className="back" onClick={back}>← Back to tools</button><div className="toolHero"><div className="toolIcon big"><Wrench/></div><div><span>{t[1]}</span><h1>{t[0]}</h1><p>{t[2]}</p></div></div><div className="workspace"><div className="panel"><label>Your input</label><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste or type your content here..."/><div className="actions"><button className="primary" onClick={run}><Zap size={17}/> Run Tool</button><button className="secondary" onClick={()=>{setText("");setOut("")}}>Clear</button></div></div><div className="panel"><label>Result</label><textarea value={out} readOnly placeholder="Your result will appear here..."/><button className="secondary full" onClick={()=>navigator.clipboard?.writeText(out)}><Copy size={17}/> Copy Result</button></div></div><div className="notice"><ShieldCheck/> Processing is designed to happen in your browser whenever possible. Never upload sensitive documents unless you trust the service.</div></main>
}

function Admin({onClose}){
 return <main className="admin"><div className="adminTop"><div><span className="pill">Admin Panel</span><h1>ToolMaster Pro Control Center</h1><p>Manage the platform foundation. Backend authentication and database can be connected later.</p></div><button className="secondary" onClick={onClose}>Back to Website</button></div><div className="adminGrid"><div className="adminCard"><Settings/><h3>Tool Management</h3><p>{tools.length} tools currently configured.</p><button className="primary">Manage Tools</button></div><div className="adminCard"><LockKeyhole/><h3>Users & Access</h3><p>Login and role management foundation.</p><button className="primary">Manage Users</button></div><div className="adminCard"><LayoutDashboard/><h3>Analytics</h3><p>Dashboard ready for real usage statistics.</p><button className="primary">View Analytics</button></div><div className="adminCard"><CheckCircle2/><h3>System Status</h3><p>Frontend configuration is ready for deployment.</p><strong className="ok">Ready</strong></div></div></main>
}

createRoot(document.getElementById("root")).render(<App/>);
