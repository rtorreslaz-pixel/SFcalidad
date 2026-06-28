package com.rommel.scaleprototype.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.auth.AuthRepository
import com.rommel.scaleprototype.databinding.FragmentLoginBinding
import com.rommel.scaleprototype.net.ApiClient
import com.rommel.scaleprototype.net.ApiException
import kotlinx.coroutines.launch

class LoginFragment : Fragment() {

    private var binding: FragmentLoginBinding? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View {
        binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding!!.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val authRepository = AuthRepository(requireContext())

        if (authRepository.isLoggedIn()) {
            goToCaptureSetup()
            return
        }

        binding?.buttonLogin?.setOnClickListener { onLoginClicked(authRepository) }
    }

    private fun onLoginClicked(authRepository: AuthRepository) {
        val b = binding ?: return
        val email = b.editEmail.text.toString().trim()
        val password = b.editPassword.text.toString()
        if (email.isEmpty() || password.isEmpty()) {
            showError(getString(R.string.error_login_fields_required))
            return
        }

        setLoading(true)
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val response = ApiClient.getInstance(requireContext()).login(email, password)
                authRepository.saveSession(response.token, response.user.id, response.user.nombre)
                goToCaptureSetup()
            } catch (e: ApiException) {
                showError(getString(R.string.error_login_invalid))
            } catch (e: Exception) {
                showError(getString(R.string.error_login_network))
            } finally {
                setLoading(false)
            }
        }
    }

    private fun goToCaptureSetup() {
        findNavController().navigate(R.id.action_login_to_captureSetup)
    }

    private fun setLoading(loading: Boolean) {
        binding?.progressLogin?.visibility = if (loading) View.VISIBLE else View.GONE
        binding?.buttonLogin?.isEnabled = !loading
    }

    private fun showError(message: String) {
        binding?.textLoginError?.text = message
        binding?.textLoginError?.visibility = View.VISIBLE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        binding = null
    }
}
