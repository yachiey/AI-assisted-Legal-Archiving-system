const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // A relatively safe regex to match opening tags that contain overflow-auto or overflow-y-auto
    // We look for '<tagName ' followed by anything up to '>', non-greedy, allowing newlines.
    // However, to prevent matching across multiple tags, we must ensure there's no '<' or '>' in between, EXCEPT inside the tag.
    // In JSX, tags can contain '>' inside arrow functions in props, but it's rare in className structures.
    // Let's use a custom parser instead of pure regex for safety.
    
    let modified = false;
    let newContent = "";
    
    // Simple state machine parser to find tags with overflow-auto
    let inTag = false;
    let currentTag = "";
    let inStringQuote = null; // can be ', ", or `
    let tagStartIdx = 0;
    
    for (let i = 0; i < content.length; i++) {
        let char = content[i];
        
        if (!inTag) {
            if (char === '<' && /[a-zA-Z]/.test(content[i+1])) {
                inTag = true;
                tagStartIdx = i;
                currentTag = char;
            } else {
                newContent += char;
            }
        } else {
            currentTag += char;
            
            if (!inStringQuote) {
                if (char === '"' || char === "'" || char === '`') {
                    inStringQuote = char;
                } else if (char === '>') {
                    // Tag ended
                    inTag = false;
                    
                    // Check if tag contains className and overflow-auto / overflow-y-auto
                    if (/(?:overflow-auto|overflow-y-auto)/.test(currentTag) && currentTag.includes('className')) {
                        if (!currentTag.includes('data-lenis-prevent')) {
                            // Find the first space after the tag name to insert the attribute
                            let spaceIdx = currentTag.search(/\s/);
                            if (spaceIdx > 0) {
                                currentTag = currentTag.substring(0, spaceIdx) + ' data-lenis-prevent' + currentTag.substring(spaceIdx);
                                modified = true;
                            }
                        }
                    }
                    newContent += currentTag;
                } else if (char === '<') {
                    // this shouldn't normally happen unless it's a generic or nested jsx, we just proceed
                }
            } else {
                if (char === inStringQuote) {
                    // Check if it's escaped
                    if (content[i-1] !== '\\') {
                        inStringQuote = null;
                    }
                }
            }
        }
    }
    
    if (inTag) {
        newContent += currentTag; // Append whatever is left
    }

    if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        return true;
    }
    return false;
}

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const targetDir = 'd:/capstone/Legal_Arch_aiu/resources/js';
const files = walk(targetDir);

let modifiedCount = 0;
files.forEach(file => {
    try {
        if (processFile(file)) {
            console.log('Modified:', file);
            modifiedCount++;
        }
    } catch (e) {
        console.error('Error processing', file, e);
    }
});

console.log(`\nCompleted! Successfully patched ${modifiedCount} files.`);
