export function getAllUrlParams(url: string): { [index: string]: string[] | string | number } {
  let queryString = url ? url.split('?')[1] : window.location.search.slice(1);
  let obj: { [index: string]: string[] | string } = {};

  if (queryString) {
    queryString = queryString.split('#')[0];
    let arr = queryString.split('&');

    for (let i = 0; i < arr.length; i++) {
      let a = arr[i].split('=');
      let pName = a[0];
      let pValue = typeof a[1] === 'undefined' ? true : a[1];

      pName = pName.toLowerCase();
      if (typeof pValue === 'string') pValue = pValue.toLowerCase();

      if (pName.match(/\[(\d+)?\]$/)) {
        let key = pName.replace(/\[(\d+)?\]/, '');
        if (!obj[key]) obj[key] = [];

        if (pName.match(/\[\d+\]$/)) {
          let index: number = parseInt(/\[(\d+)\]/.exec(pName)![1]);
          (obj[key] as string[])[index] = pValue as string;
        } else {
          (obj[key] as string[]).push(pValue as string);
        }
      } else {
        if (!obj[pName]) {
          obj[pName] = pValue as string;
        } else if (obj[pName] && typeof obj[pName] === 'string') {
          obj[pName] = [obj[pName] as string];
          (obj[pName] as string[]).push(pValue as string);
        } else {
          (obj[pName] as string[]).push(pValue as string);
        }
      }
    }
  }
  return obj;
}
export function isElementFullScreen(mediaId: string): boolean {
  if (document.fullscreenElement) {
    return document.fullscreenElement.id === mediaId;
  }
  return false;
}

export function queryParamPresentAndEnabled(param: string, params: any) {
  if (params.hasOwnProperty(param)) {
    return params[param] === 1;
  }
  return false;
}
