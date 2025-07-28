/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { type AiDeploymentList, type AiDeploymentStatus, DeploymentApi, ScenarioApi, type AiModelList } from '@sap-ai-sdk/ai-api';
import { ILogService } from '../../../platform/log/common/logService';
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { devspace } from "@sap/bas-sdk";
import { BASLLMProxy } from './basLLMProxy';

const AI_CORE_CREDS_FILENAME = "ai-core-creds.json";

/**
 * Retrieve information about all models available in LLM global scenario.
 * @param scenarioId - ID of the global scenario.
 * @param resourceGroup - AI-Resource-Group where the resources are available.
 * @returns All models in given scenario.
 */
export async function getModelsInScenario(
	scenarioId: string,
	resourceGroup: string
): Promise<AiModelList> {
	return ScenarioApi.scenarioQueryModels(scenarioId, {
		'AI-Resource-Group': resourceGroup
	}).execute();
}

/**
 * Get all deployments filtered by status.
 * @param resourceGroup - AI-Resource-Group where the resources are available.
 * @param status - Optional query parameter to filter deployments by status.
 * @returns List of deployments.
 */
export async function getDeployments(
	resourceGroup: string,
	status?: AiDeploymentStatus
): Promise<AiDeploymentList> {
	// check for optional query parameters.
	const queryParams = status ? { status } : {};
	return DeploymentApi.deploymentQuery(queryParams, {
		'AI-Resource-Group': resourceGroup
	}).execute();
}

/**
 * Adheres to the AI Core tool name requirements:
 * https://github.com/SAP/ai-sdk-js/blob/main/packages/orchestration/src/client/api/schema/function-object.ts#L15-L20
 * @param name
 * @returns
 * @returns
 */
export function sanitizeToolName(name: string): string {
	// Replace any character not in [a-zA-Z0-9-_] with "-"
	let sanitized = name.replace(/[^a-zA-Z0-9-_]/g, "-");
	// Remove duplicate dashes/underscores, and trim
	sanitized = sanitized.replace(/[-_]{2,}/g, "-");
	// Remove starting/trailing dashes/underscores
	sanitized = sanitized.replace(/^[-_]+|[-_]+$/g, "");
	// Ensure max length 64
	if (sanitized.length > 64) {
		sanitized = sanitized.substring(0, 64);
	}
	// Fallback if empty
	if (sanitized.length === 0) { sanitized = "tool"; }
	return sanitized;
}

function getAiCoreCredsPath() {
	return path.join(os.homedir(), AI_CORE_CREDS_FILENAME);
}

function loadAiCoreCredentials(): string {
	const credsFilePath = getAiCoreCredsPath();
	if (!fs.existsSync(credsFilePath)) { throw new Error("AI Core credentials not found."); }
	const contents = fs.readFileSync(credsFilePath, "utf-8");
	const parsed = JSON.parse(contents);
	const missing: string[] = [];
	if (!parsed.clientid) { missing.push("clientid"); }
	if (!parsed.clientsecret) { missing.push("clientsecret"); }
	if (!parsed.url) { missing.push("url"); }
	if (!parsed.serviceurls?.AI_API_URL) { missing.push("serviceurls.AI_API_URL"); }
	if (missing.length) { throw new Error("Missing: " + missing.join(", ")); }
	return JSON.stringify(parsed);
}

export function ensureAiCoreEnv(logService: ILogService): void | BASLLMProxy {
	let creds: string | undefined;

	try {
		creds = loadAiCoreCredentials();
	} catch (err) {
		logService.logger.info(`Failed to load AI Core credentials: ${err}. Trying to get from BAS Proxy.`);
	}

	if (creds) {
		process.env["AICORE_SERVICE_KEY"] = creds;
		logService.logger.info(`AI Core service credentials loaded successfully from file ~/${AI_CORE_CREDS_FILENAME}.`);
	} else if (devspace.isBuildCode()) {
		logService.logger.info("AI Core credentials missing. Falling back to BAS Proxy LLM AI Core setup.");
		return new BASLLMProxy(logService);
	} else {
		logService.logger.info(
			`AI Core setup failed. Please check the credentials file ~/${AI_CORE_CREDS_FILENAME} or ensure working in BAS BuildCode.`,
		);
	}
}