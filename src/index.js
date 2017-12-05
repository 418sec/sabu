'use strict'

const fs = require('fs')
const path = require('path')
const program = require('commander')

process.title = 'sabu'

const defaultOpts = {
    source:     process.cwd(),
    sourceRel:  process.cwd(),
    host:       process.env.HOST || '0.0.0.0',
    port:       process.env.PORT || 8080
}

program
    .version('1.0.0')
    .usage('[options]')
    .arguments('[path]')
    .option('-h, --host <s>', 'Host (default: "0.0.0.0"')
    .option('-p, --port <n>', 'Port (default: 8080)', parseInt)
    .option('-q, --quiet', 'Quiet startup (no console output)')
    .option('-c, --config <s>', 'JSON config file with options')
    .action(target => { source = target })

program.parse(process.argv)

const createTag = (a, b) => {
    let tag = fs.readFileSync(path.resolve(__dirname, 'sabu.tag'), 'utf8')
    tag = tag.replace('%1', a)
    tag = tag.replace('%2', b)
    return tag
}

const clearLines = n => {
    
    process.stdout.moveCursor(0)
    process.stdout.clearLine()
    
    for (let i = n; i > 0; i--) {
        process.stdout.moveCursor(0, -1)
        process.stdout.clearLine()
    }
    
}

const connect = (host, port, source) => {
    
    app.listen(port, host, () => {
        
        const tag = createTag(
            `Sabu listening at http://${host}:${port}`,
            `Files served from ${source}`
        )
        
        if (triedConnecting && !program.quiet) {
            // Clear previous output since the port likely changed
            clearLines(tag.split('\n').length - 1)
        }
        
        triedConnecting = true
        
        if (!program.quiet) process.stdout.write(tag)
        
    })
}

const start = opts => {
    
    let {
        source,
        sourceRel,
        host,
        port
    } = opts
    
    try {
        sourceRel = path.relative(process.cwd(), source)
        sourceRel = sourceRel ? sourceRel : '.'
    }
    catch (e) {}
    
    if (!fs.existsSync(source))
        throw new Error('Path not found "' + source + '"')
    
    app.on('error', e => {
        if (e.code === 'EADDRINUSE') {
            port++
            connect(host, port, (sourceRel || source))
        }
    })
    
    connect(host, port, (sourceRel || source))
    
}

let opts = null
let triedConnecting = false

if (program.config) {
    
    // Use JSON config
    
    if (!fs.existsSync(program.config))
        throw new Error('Config file not found', program.config)
    
    opts = fs.readFileSync(program.config, 'utf8')
    
    try {
        opts = JSON.parse(opts)
        opts = Object.assign(defaultOpts, opts)
    }
    catch (e) {
        console.error('Failed to load config file')
        throw e
    }
    
}
else {
    
    // Use CLI options
    
    opts = Object.assign({}, defaultOpts)
    
    if (program.host) opts.host = program.host
    if (program.port) opts.port = program.port
    
}

const app = require('./app')(opts)

start(opts)
