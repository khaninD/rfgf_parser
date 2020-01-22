const fetch = require('node-fetch')
const fs = require('fs');
const nodeParse = require('node-html-parser')
const parse = nodeParse.parse


const url = 'https://www.rfgf.ru/gkm/coordsrv.php'
const passportUrl = 'https://www.rfgf.ru/gkm/itemview.php'
const requestErrorText = 'Не удалось выполнить запрос'

const data = []

/**
 * Метод для парсинга html строки
 * @param {String } htmlString - html страницы
 * @returns {string}
 */
const getTGF = htmlString => {
  let result = ''
  const root = parse(htmlString)
  const resultItem = root && root.querySelector('#results')
  const table = resultItem && resultItem.querySelector('table')
  const tr = table && table.querySelectorAll('tr')
  const target = tr && tr.length && tr[1]
  if (target) {
    const tds = target && target.querySelectorAll('td')
    const targetCell = tds && tds.length && tds[2]
    result = targetCell && targetCell.innerHTML
  }
  return result || ''
}

/**
 * Метод для получения данных (паспорта ТГФ и координатов) по id
 * @param {Number} id - id области
 * @returns {Promise<void>}
 */
const getData = async id => {
  try {
    const responseCoords = await fetch(`${url}?id=${id}`)
    const responsePassportNumber = await fetch(`${passportUrl}?id=${id}`)
    if (responseCoords.ok && responsePassportNumber.ok) {
      const json = await responseCoords.json()
      const tgfText = await responsePassportNumber.text()
      if (json && json.length) {
        let isActive = false
        // Проверка на данные
        json.forEach(({ coords, header }) => {
          if (header && coords && coords.length) {
            isActive = true
          }
        })
        if (isActive) {
          const passportTGF = getTGF(tgfText)
          data.push({
            passportTGF,
            id,
            data: json
          })
        }
      }
    }
  } catch(e) {
    console.log(e, requestErrorText)
  }
}

const itterData = async countItems => {
  for (let i = 0; i <= countItems; i++) {
    await getData(i)
    console.log('completed:', (i / countItems * 100).toFixed(2), '%', 'i: ', i)
  }
  fs.writeFile('coordsData.json', JSON.stringify(data, null, 2), 'utf8', () => {
    console.log('file created!')
  });
}

//itterData(58000)
itterData(10)


