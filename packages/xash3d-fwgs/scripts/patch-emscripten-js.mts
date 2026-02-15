import {promises as fs} from 'fs';

class CompileFile {
    private data: string

    constructor(data: string) {
        this.data = data
    }

    replaceAll(find: string, replace: string) {
        this.data = this.data.split(find).join(replace)
    }

    deleteAll(find: string) {
        this.replaceAll(find, '')
    }

    save() {
        return fs.writeFile('./lib/generated/xash.js', this.data)
    }
}

const FILE_PATH = './dist/raw.js'

async function main() {
    const raw = await fs.readFile(FILE_PATH, 'utf8')

    await fs.writeFile(FILE_PATH, raw)
    const f = new CompileFile(raw)

    // fix CJS export to EJS
    f.deleteAll('// Export using a UMD style export, or ES6 exports if selected')
    f.deleteAll('if (typeof exports === \'object\' && typeof module === \'object\') {')
    f.deleteAll('module.exports = Xash3D;')
    f.deleteAll('// This default export looks redundant, but it allows TS to import this')
    f.deleteAll('// commonjs style module.')
    f.deleteAll('module.exports.default = Xash3D;\n}')
    f.deleteAll('else if (typeof define === \'function\' && define[\'amd\'])')
    f.replaceAll(`define([], () => Xash3D);`,
        'export default Xash3D;')

    // add on start async FS callback
    f.deleteAll('run();')
    f.deleteAll(';if(runtimeInitialized){moduleRtn=Module}else{moduleRtn=new Promise((resolve,reject)=>{readyPromiseResolve=resolve;readyPromiseReject=reject})}')

    // return engine funcs instead of runtime promise
    f.replaceAll('return moduleRtn;', `
        return {
            Module,
            FS,
            SOCKFS,
            DNS,
            HEAPU32,
            HEAP32,
            HEAP16,
            HEAP8,
            HEAPU8,
            getValue,
            addFunction,
            removeFunction,
            setValue,
            writeArrayToMemory,
            intArrayFromString,
            writeSockaddr,
            readSockaddr,
            AsciiToString,
            _malloc,
            addRunDependency,
            removeRunDependency,
            start: () => {
                run();
                if (runtimeInitialized) {
                    moduleRtn = Module
                } else {
                    moduleRtn = new Promise((resolve, reject) => {
                        readyPromiseResolve = resolve;
                        readyPromiseReject = reject
                    })
                }
            },
        };
    `)

    await f.save()
}

main()
