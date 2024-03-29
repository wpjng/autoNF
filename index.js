const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

const url = ''
const spreadsheet = ''
const tableNameExpenses = 'Despesas'
const columnLabel = 'A'
const columnValue = 'B'
const columnDate = 'E'

async function getItems (url) {
  try {
    const response = await axios.get(url);

    if (response.status !== 200)
      throw 'request fail' + response?.response?.data || response;

    const $ = await cheerio.load(response.data);

    const table = await $('#tabResult > tbody:nth-child(1)');
    let infos = await $('#infos')
    let key = infos[0].children[3].children[3].children[1].children[5].children[0].data
    //   console.log('key :', key)

    let date = infos[0].children[1].children[3].children[1].children[8].data.split('-')[0].trim().split(' ')[0];
    //  console.log('date :', date)
    let items = [];

    const qtdElements = table.children().length;
    for (let i = 0; i < qtdElements; i++) {
      let label = table.children()[i].children.filter(c => c.name === 'td')
      label = label[0].children.find(c => c.attribs.class === 'txtTit')
      label = label.children[0].data

      //  console.log('name: ', label)

      let value = table.children()[i].children.filter(c => c.name === 'td')
      value = value[1].children.find(c => c.name === 'span')
      value = value.children[0].data
      // console.log('value: ', value)

      items.push({ label, value })

    }
    return { items, key, date }
  } catch (e) {
    console.error('Error on getItems: ', e);
  }
}

async function main (spreadsheetId, nfURL) {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/spreadsheets',
      keyFilename: ''///JSON GOOGLE AUTH FILE
    });

    const items = await getItems(nfURL)


    const service = google.sheets({ version: 'v4', auth });

    const despesas = await service.spreadsheets.values.get({
      auth, spreadsheetId, range: tableNameExpenses
    });
    /* const nfs = await service.spreadsheets.values.get({
      auth, spreadsheetId, range: 'NFs'
    }); */

    const qtdLinesDespesas = despesas.data.values.length
    //  const qtdLinesNfs = nfs.data.values.length
    console.log(qtdLinesDespesas)


    items.items.forEach((it, index) => {
      const rangeLV = `${tableNameExpenses}!${columnLabel}${qtdLinesDespesas + index + 1}:${columnValue}${qtdLinesDespesas + index + 1}`
      const rangeDT = `${tableNameExpenses}!${columnDate}${qtdLinesDespesas + index + 1}`
      console.log('item: ', it.label)
      const data = [
        {
          range: rangeLV,
          values: [
            [it.label, it.value]
          ]
        },
        {
          range: rangeDT,
          values: [
            [items.date]
          ]
        }
      ]

      const result = service.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          data,
          valueInputOption: 'USER_ENTERED',
        }
      })
      //console.log('Error? ', result);

    })
    console.log('---END---')
  } catch (e) {
    console.error('Error on main: ', e);
  }
}
main(spreadsheet, url)


