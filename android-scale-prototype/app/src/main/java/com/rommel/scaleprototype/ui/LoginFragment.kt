package com.rommel.scaleprototype.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.rommel.scaleprototype.R
import com.rommel.scaleprototype.auth.AuthRepository
import com.rommel.scaleprototype.data.AppDatabase
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
                warnIfPendingFromOtherUserThenContinue(response.user.id)
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

    /**
     * El servidor atribuye cada registro a quien esté logueado al SUBIRLO. Si en este
     * teléfono quedaron pendientes de otro verificador, se advierte antes de continuar
     * para que la atribución cruzada no pase desapercibida (los datos no se pierden:
     * suben igual, pero a nombre de quien acaba de entrar).
     */
    private fun warnIfPendingFromOtherUserThenContinue(userId: String) {
        viewLifecycleOwner.lifecycleScope.launch {
            val dao = AppDatabase.getInstance(requireContext()).registroPesoDao()
            val ajenos = dao.countUnsyncedFromOtherUser(userId)
            if (ajenos == 0) {
                goToCaptureSetup()
                return@launch
            }
            val nombre = dao.latestOtherUserNombre(userId) ?: getString(R.string.other_user_fallback)
            MaterialAlertDialogBuilder(requireContext())
                .setTitle(R.string.pending_other_user_title)
                .setMessage(getString(R.string.pending_other_user_message, ajenos, nombre))
                .setPositiveButton(R.string.pending_other_user_continue) { _, _ -> goToCaptureSetup() }
                .setCancelable(false)
                .show()
        }
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
