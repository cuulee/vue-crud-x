import moment from 'moment'
import {firestore} from '../../firebase'

export const crudTable = {
  headers: [
    { text: 'Party', value: 'party', align: 'left', sortable: false },
    { text: 'Type', value: 'type', align: 'left' },
    { text: 'Value', value: 'value', align: 'left' },
    { text: 'Date Time', value: 'datetime', align: 'left' },
    { text: 'Status', value: 'approveStatus', align: 'left' },
    { text: 'Approver', value: 'approver', align: 'left' }
  ],
  formatters: (value, _type) => {
    if (_type === 'datetime') return moment(value).format('YYYY MMM DD HH:mm')
    return value
  }
}

export const crudFilter = {
  FilterVue: () => ({
    component: import('./NotesFilter.vue')
    // loading: LoadingComp,
    // error: ErrorComp,
    // delay: 200,
    // timeout: 3000
  }),
  filterData: {
    dateStart: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    dateEnd: moment().format('YYYY-MM-DD'),
    selectX: { text: 'All', value: 'all' }
  }
}

export const crudForm = {
  FormVue: () => ({ component: import('./NotesForm.vue') }),
  defaultRec: {
    id: null,
    approver: null,
    party: null,
    type: null,
    value: null,
    approveStatus: 'pending'
  }
}

export const crudOps = { // CRUD
  delete: async (payload) => {
    const {id} = payload
    try {
      await firestore.doc('note/' + id).delete()
    } catch (e) { }
  },
  find: async (payload) => {
    let records = []
    const {pagination} = payload
    try {
      const {dateStart, dateEnd, selectX} = payload.filterData
      let start = new Date(dateStart + ' 00:00:00')
      let end = new Date(dateEnd + ' 23:59:59')
      let dbCol = firestore.collection('note')
        .where('datetime', '>=', start)
        .where('datetime', '<=', end)
      if (selectX.value !== 'all') {
        dbCol = dbCol.where('approveStatus', '==', selectX.value)
      }
      dbCol = dbCol.orderBy('datetime', 'desc').limit(200)
      const rv = await dbCol.get()
      rv.forEach(record => {
        let tmp = record.data()
        tmp.id = record.id
        records.push(tmp)
      })
    } catch (e) { }
    return {records, pagination}
  },
  findOne: async (payload) => {
    const {id} = payload
    let record = { }
    try {
      const doc = await firestore.collection('note').doc(id).get()
      if (doc.exists) {
        record = doc.data()
        record.id = id
        record.approveStatus = {text: record.approveStatus, value: record.approveStatus}
      }
    } catch (e) { }
    return record
  },
  create: async (payload) => {
    const {
      record: {party, type, value}
    } = payload
    try {
      try {
        let data = {}
        const collectionNote = firestore.collection('note')
        data.party = party
        data.type = type
        data.value = value
        data.datetime = new Date()
        data.approver = ''
        data.approveStatus = 'pending'
        await collectionNote.add(data)
      } catch (e) { }
    } catch (e) { }
  },
  update: async (payload) => {
    let {
      record: {id, approver, approveStatus},
      addons: {userId}
    } = payload
    const {value} = approveStatus
    approver = (value === 'approved' || value === 'rejected') ? userId : ''
    approveStatus = value
    try {
      const document = firestore.doc('note/' + id)
      await document.update({
        approver,
        approveStatus
      })
    } catch (e) { }
  }
}