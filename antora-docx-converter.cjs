'use strict'

const fsp = require('node:fs/promises')
const ospath = require('node:path')

const DEFAULT_COMMAND = './adoc-to-docx'

async function convert (file, convertAttributes, buildConfig, { logCommand, runCommand }) {
  const { command, cwd = process.cwd(), attributeOptionFlag = '-a', stderr = 'print' } = buildConfig
  logCommand?.(command, file, convertAttributes, attributeOptionFlag)
  const args = convertAttributes.toArgs(attributeOptionFlag, command).concat('-o', convertAttributes.outfile, '-')
  return runCommand(command, args, { parse: false, cwd, stdin: file.contents, stdout: 'print', stderr })
}

function getDefaultCommand () {
  return DEFAULT_COMMAND
}

module.exports = {
  convert,
  backend: 'docx',
  getDefaultCommand,
  extname: '.docx',
  mediaType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  loggerName: 'antora-docx-extension',
}
