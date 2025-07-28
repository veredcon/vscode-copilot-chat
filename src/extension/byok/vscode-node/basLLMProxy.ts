/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import axios from "axios";
import { ILogService } from '../../../platform/log/common/logService';
import { AiDeployment } from '@sap-ai-sdk/ai-api';

export const BAS_URL_ENV_NAME = "H2O_URL";
export const BAS_LLM_SERVICE_NAME = "llm";

function getLLMServiceUrl(): string {
	return `${process.env[BAS_URL_ENV_NAME]}/${BAS_LLM_SERVICE_NAME}/v2`;
}

export class BASLLMProxy {
	private static deployments: any[] = [];

	constructor(
		@ILogService private readonly _logService: ILogService
	) {

	}

	public async getDeployments(resourceGroup?: string): Promise<AiDeployment[]> {
		if (!BASLLMProxy.deployments || BASLLMProxy.deployments.length === 0) {
			const apiUrl = getLLMServiceUrl();
			const accessUrl = `${apiUrl}/lm/deployments`;
			const ai_resource_group = resourceGroup || "default";

			const response = await axios.get(accessUrl, {
				headers: {
					"Content-Type": "application/json",
					"AI-Resource-Group": ai_resource_group,
				},
			});
			BASLLMProxy.deployments = response.data && response.data.resources;
		}
		return BASLLMProxy.deployments;
	}

	public async getDeploymentUrl(modelName: string, modelVersion?: string, resourceGroup?: string): Promise<string> {
		const deployments = await this.getDeployments(resourceGroup);
		const foundResource = deployments.find((res) => {
			const modelDetail = res.details?.resources?.backend_details?.model;
			if (modelVersion) {
				return modelDetail?.name === modelName && modelDetail?.version === modelVersion;
			} else {
				return modelDetail?.name === modelName;
			}
		});
		if (foundResource) {
			const apiUrl = getLLMServiceUrl();
			return `${apiUrl}/inference/deployments/${foundResource.id}`;
		} else {
			// fallback to the first matched model without version
			const defaultDeployment = deployments.find(
				(res) => res.details?.resources?.backend_details?.model?.name === modelName,
			);
			if (defaultDeployment) {
				const apiUrl = getLLMServiceUrl();
				return `${apiUrl}/inference/deployments/${defaultDeployment.id}`;
			} else {
				this._logService.logger.error(`Cannot find the deployment URL for the model ${modelName}`);
				return "";
			}
		}
	}

	public async getCompletionUrl(modelName: string, modelVersion?: string, resourceGroup?: string): Promise<string> {
		const deploymentUrl = await this.getDeploymentUrl(modelName, modelVersion, resourceGroup);
		this._logService.logger.info(`Deployment URL: ${deploymentUrl}`);
		if (deploymentUrl) {
			const uriParameters = `chat/completions?api-version=2023-05-15`;
			return `${deploymentUrl}/${uriParameters}`;
		} else {
			return "";
		}
	}

	private getCompletionRequestConfig(resourceGroup?: string): any {
		return {
			headers: {
				"Content-Type": "application/json",
				"AI-Resource-Group": resourceGroup || "default",
			},
		};
	}

	public async requestCompletion(
		modelName: string,
		payload: any,
		modelVersion?: string,
		resourceGroup?: string,
		deploymentUrl?: string
	): Promise<string | undefined> {
		const url = deploymentUrl ? deploymentUrl : await this.getCompletionUrl(modelName, modelVersion, resourceGroup);

		try {
			const response = await axios.post(url, payload, {
				...this.getCompletionRequestConfig(resourceGroup)
			});

			if (response?.status === 200 && response.data?.choices?.length > 0 && response.data.choices[0]?.message?.content) {
				return response.data.choices[0].message.content;
			} else {
				console.error(`Unexpected status code: ${response.status}`);
			}
		} catch (error: any) {
			console.error(`Request failed: ${error}`);
		}

		return undefined;
	}
}