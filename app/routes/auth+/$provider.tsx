import type { DataFunctionArgs } from '@remix-run/server-runtime'
import { redirect } from '@remix-run/node'
import { authenticator } from '~/utils/auth.server'
import invariant from 'tiny-invariant'

export function loader() {
	return redirect('/login')
}

export function action({ request, params }: DataFunctionArgs) {
	invariant(typeof params.provider === 'string', 'provider is required')
	return authenticator.authenticate(params.provider, request)
}
