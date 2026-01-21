import fs from 'fs'
import path from 'path'

// 复制文件和目录
function copyRecursive(src, dest) {
  const stat = fs.statSync(src)

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }
    const files = fs.readdirSync(src)
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file))
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

// 复制 popup 文件
copyRecursive('src/popup.html', 'popup.html')
copyRecursive('src/popup.js', 'popup.js')

// 复制 content scripts
if (!fs.existsSync('content')) {
  fs.mkdirSync('content', { recursive: true })
}
fs.readdirSync('src/content').forEach(file => {
  copyRecursive(path.join('src/content', file), path.join('content', file))
})

// 复制 icons
if (fs.existsSync('src/icons')) {
  if (!fs.existsSync('icons')) {
    fs.mkdirSync('icons', { recursive: true })
  }
  fs.readdirSync('src/icons').forEach(file => {
    copyRecursive(path.join('src/icons', file), path.join('icons', file))
  })
}

console.log('✓ Files copied from src/ to root directory')
