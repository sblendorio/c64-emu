const STORAGE_KEY = "c64emu";

const idb = idbKeyval;
const store = new idb.Store(STORAGE_KEY, STORAGE_KEY);

async function dir() {
   const keys = await idb.keys(store);
   console.log(keys);   
   keys.forEach(async fn=>{
      const file = await readFile(fn);
      const length = file.length;
      console.log(`${fn} (${length} bytes)`);
   });
}

async function fileExists(filename) {
   return await idb.get(filename, store) !== undefined;
}

async function readFile(fileName) {
   const bytes = await idb.get(fileName, store);   
   return bytes;
}

async function writeFile(fileName, bytes) {  
   await idb.set(fileName, bytes, store);   
}

async function removeFile(fileName) {
   await idb.del(fileName, store);   
}

// *******************************************************************************************

/*
function getStore() {
   const store = window.localStorage.getItem(STORAGE_KEY);
   if(store === undefined || store === null) return {};
   let ob = {};
   try 
   {
      ob = JSON.parse(store);
   }
   catch(ex) 
   {
   }
   return ob;
}

function setStore(store) {
   window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
*/

async function load(filename, p) {
   if(!await fileExists(filename)) {
      console.log(`file "${filename}" not found`);
      return;
   }
   
   const ext = filename.substr(-4).toLowerCase();

        if(ext === ".prg") await load_file(filename, p);
   else if(ext === ".tap") await load_tap(filename);
   else console.log("give filename .prg or .tap extension");
}

async function save(filename, p1, p2) {
   const ext = filename.substr(-4).toLowerCase();

        if(ext == ".prg") await save_file(filename, p1, p2);
   else if(ext == ".emu") await save_state(filename);
   else console.log("give filename .prg or .emu extension");
}

function loadBytes(bytes, address, fileName) {
   let buffer = new Uint8Array(bytes.buffer);

   const load_address = (buffer[0] | buffer[1] << 8);

   // setTimeout(()=>do_load(buffer, bytes.length), 4000);
   wait_and_load(buffer, bytes.length);
}

function wait_and_load(buffer, num_bytes) {
   if(mem_read(204)!==0) {
      // cursor not flashing, system not yet booted
      setTimeout(()=>wait_and_load(buffer, num_bytes), 100);
      return;
   }
   do_load(buffer, num_bytes);
   console.log(`loaded ${num_bytes} bytes`);
}

function do_load(buffer, num_bytes) {
   c64.load_prg(buffer, num_bytes);
   paste("RUN\r");
}

async function load_file(fileName, address) {   
   const bytes = await readFile(fileName);
   loadBytes(bytes, address, fileName);
}

async function load_tap(fileName) {
   const bytes = await readFile(fileName);

   let buffer = new Uint8Array(bytes.buffer);
   let ok = c64.tape.insert(buffer, bytes.length);

   if(ok) {
      console.log(`insert tape file "${fileName}" of ${bytes.length} bytes`);
   }
   else {
      console.log(`*** failed to insert tape file "${fileName}" of ${bytes.length} bytes`);
   }

}

const BASTXT = 0x002b;
const PROGND = 0x002d;

async function save_file(filename, start, end) {
   if(start === undefined) start = mem_read_word(BASTXT);
   if(end === undefined) end = mem_read_word(PROGND)-1;

   const prg = [ start & 0xFF, start >> 8 ];
   for(let i=0,t=start; t<=end; i++,t++) {
      prg.push(mem_read(t));
   }
   const bytes = new Uint8Array(prg);
   
   await writeFile(filename, bytes);

   console.log(`saved "${filename}" ${bytes.length} bytes from ${hex(start,4)}h to ${hex(end,4)}h`);
   //cpu.reset();
}

async function remove(filename) {   
   if(await fileExists(filename)) {
      await removeFile(filename);
      console.log(`removed "${filename}"`);
   }
   else {
      console.log(`file "${filename}" not found`);
   }
}

async function download(fileName) {   
   if(!await fileExists(fileName)) {
      console.log(`file "${fileName}" not found`);
      return;
   }
   const bytes = await readFile(fileName);
   let blob = new Blob([bytes], {type: "application/octet-stream"});   
   saveAs(blob, fileName);
   console.log(`downloaded "${fileName}"`);
}

function upload(fileName) {
   throw "not impemented";
}
