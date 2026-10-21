import importlib.util
import pathlib
import unittest

spec=importlib.util.spec_from_file_location(
    "ocr_products",pathlib.Path(__file__).resolve().parents[1]/"scripts"/"ocr-products.py"
)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ProductLabelOCR(unittest.TestCase):
    def test_extract_only_codes_and_known_brand_hints(self):
        s=module.collect_hints("NIKE SKU DD1391-100 WHITE 42")
        self.assertEqual(s["brandHints"],["Nike"])
        self.assertIn("DD1391-100",s["skuCandidates"])
        self.assertNotIn("WHITE",str(s))
    def test_never_store_raw_phone_price_date_or_contact(self):
        s=module.collect_hints("CEL +52 5544448888 precio $900 2026-10-21")
        self.assertEqual(s["skuCandidates"],[])
        self.assertEqual(s["brandHints"],[])
    def test_deduplicate_and_filter_unknown_generic_text(self):
        s=module.collect_hints("ADIDAS adidas ABCD-DD22 ABCD-DD22")
        self.assertEqual(s["brandHints"],["Adidas"])
        self.assertEqual(s["skuCandidates"],["ABCD-DD22"])

if __name__=="__main__":
    unittest.main()
