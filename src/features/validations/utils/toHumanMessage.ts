import { FALLBACK, MESSAGES } from '../data/validationsData';

export function toHumanMessage(message: string): string {
	return MESSAGES.find(([re]) => re.test(message))?.[1]() ?? FALLBACK();
}
