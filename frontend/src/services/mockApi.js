const wait = ms => new Promise(res=>setTimeout(res,ms))
export const api = {
  getDashboard: async () => {
    await wait(300)
    return { aum: 254000, folios: 4, recent: [
      {id:1,type:'Purchase',amount:5000,date:'2025-08-01'},
      {id:2,type:'SIP',amount:2000,date:'2025-07-05'},
    ], holdings: [
      {name:'Equity Growth', units:120.5, nav:45.12, value:5440},
      {name:'Debt Stability', units:50, nav:25.4, value:1270}
    ], performance: [
      {name:'Jan', value:10}, {name:'Feb', value:15}, {name:'Mar', value:8}, {name:'Apr', value:20}
    ] }
  },
  getFolios: async ()=> {
    await wait(200)
    return [
      {id:1, name:'Equity Growth', units:120.5, nav:45.12},
      {id:2, name:'Debt Stability', units:50, nav:25.4}
    ]
  }
}
export default api
