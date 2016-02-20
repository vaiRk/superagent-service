'use strict';

import request from 'superagent-bluebird-promise';

export default initService(urls) {
	this._urls = urls;

	/**
	 * Normalise URL.
	 * @param  {string} url
	 * @return {string}
	 */
	_getUrl(url, urlParams) {
		if (process.env.NODE_ENV === 'development') {
			if (!this._urls[url]) {
				throw new Error(`The URL provided "${url}" is not listed on the service.`);
			}
		}

		url = this._urls[url];

		if (urlParams) {
			url = _replaceUrlParams(url, urlParams);
		}

		return API_HOST + url;
	}

	/**
	 * Replace URL parameters.
	 * @param  {string} url
	 * @param  {object} urlParams
	 * @return {string}
	 */
	_replaceUrlParams(url, urlParams) {
		return url.replace(/\/:(.*)\/?/g, function(rawUrl, urlParam) {
			const value = urlParams[urlParam];

			if (process.env.NODE_ENV === 'development') {
				if (!value) {
					throw new Error(`The URL provided "${url}" requires a "${urlParam}" parameter.`);
				}
			}

			delete urlParams[urlParam];

			return rawUrl.replace(urlParam, value).replace(':', '');
		});
	}

	/**
	 * Returns an object containing request headers.
	 * @param  {?object} headers
	 * @return {object}
	 */
	_getHeaders(headers) {
		return {
			'Authorization': 'Token ' + localStorage.getItem('token'),
			'Content-Type': 'application/json',
			...headers
		};
	}

	/**
	 * Parse successful API responses.
	 * @param  {object} response
	 * @return {mixed}
	 */
	_callbackProcessor({ text: response }) {
		return JSON.parse(response);
	}

	/**
	 * Use superagent to perform a request and return a promise.
	 * @param  {string} method
	 * @param  {object} params
	 * @return {Promise}
	 */
	_doRequest(method, params) {
		let req = null;
		const url = _getUrl(params.url, params.urlParams);
		const requestData = params.params || {};
		const queryData = params.query || {};
		const headers = _getHeaders(params.headers);
		const callbackProcessor = params.callbackProcessor || _callbackProcessor;

		switch (method) {
			case 'GET':
				req = request.get(url).query(requestData || queryData);
				break;
			case 'POST':
				req = request.post(url).query(queryData).send(requestData);
				break;
			case 'DELETE':
				req = request.del(url);
				break;
			default:
				if (process.env.NODE_ENV === 'development') {
					throw new Error(`"${method}" is not a valid method.`);
				}
		}

		return req
			.accept('application/json')
			.set(headers)
			.then(callbackProcessor);
	}

	/**
	 * @param  {object} params
	 * @return {Promise}
	 */
	doGet(params) {
		return _doRequest('GET', params);
	}

	/**
	 * @param  {object} params
	 * @return {Promise}
	 */
	doPost(params) {
		return _doRequest('POST', params);
	}

	/**
	 * @param  {object} params
	 * @return {Promise}
	 */
	doDelete(params) {
		return _doRequest('DELETE', params);
	}

	return {
		doGet,
		doPost,
		doDelete
	};
};