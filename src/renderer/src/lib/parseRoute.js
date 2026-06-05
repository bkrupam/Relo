/** Route parse results to parsed vs ambiguous (time picker) screens. */
export function routeParseResult(dispatch, data) {
  const dataArr = Array.isArray(data) ? data : [data]
  const goAmbiguous = dataArr.length === 1 && (dataArr[0].ambiguous || !dataArr[0].when)
  if (goAmbiguous) {
    dispatch({ type: 'AMBIGUOUS', data: dataArr })
  } else {
    dispatch({ type: 'PARSED', data: dataArr })
  }
}
