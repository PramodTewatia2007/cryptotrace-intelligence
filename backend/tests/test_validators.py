import pytest
from app.adapters.validator import BlockchainValidator

def test_bitcoin_address_validation():
    # Valid Bitcoin addresses
    assert BlockchainValidator.is_valid_bitcoin("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa") # P2PKH
    assert BlockchainValidator.is_valid_bitcoin("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy") # P2SH
    assert BlockchainValidator.is_valid_bitcoin("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq") # Bech32 Segwit
    
    # Invalid Bitcoin address
    assert not BlockchainValidator.is_valid_bitcoin("0x71C8364762A80869d6517a1a5b8109F200e4708A")
    assert not BlockchainValidator.is_valid_bitcoin("not_an_address")

def test_evm_address_validation():
    # Valid EVM addresses
    assert BlockchainValidator.is_valid_evm("0x71C8364762A80869d6517a1a5b8109F200e4708A")
    assert BlockchainValidator.is_valid_evm("0x28C6c06298d514Db089934071355E5743bf21d60")

    # Invalid EVM addresses
    assert not BlockchainValidator.is_valid_evm("0x123")
    assert not BlockchainValidator.is_valid_evm("TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe")

def test_tron_address_validation():
    # Valid Tron addresses
    assert BlockchainValidator.is_valid_tron("TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe")
    assert BlockchainValidator.is_valid_tron("TD89vWxyQr3Pn9bM2oK5r7ZpT8E2aB4cDe")

    # Invalid Tron addresses
    assert not BlockchainValidator.is_valid_tron("0x71C8364762A80869d6517a1a5b8109F200e4708A")
    assert not BlockchainValidator.is_valid_tron("TShort")

def test_solana_address_validation():
    # Valid Solana address
    assert BlockchainValidator.is_valid_solana("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs")
    assert not BlockchainValidator.is_valid_solana("0x123")

def test_network_detection():
    eth_candidates = BlockchainValidator.detect_network("0x71C8364762A80869d6517a1a5b8109F200e4708A")
    assert "ETHEREUM" in eth_candidates
    assert "BSC" in eth_candidates
    assert "POLYGON" in eth_candidates

    tron_candidates = BlockchainValidator.detect_network("TY48xHqyQp2Wn4bL9oK3r8ZmN9E1aB5cDe")
    assert "TRON" in tron_candidates

    btc_candidates = BlockchainValidator.detect_network("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")
    assert "BITCOIN" in btc_candidates
